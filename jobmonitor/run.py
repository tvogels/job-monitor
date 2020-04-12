#!/usr/bin/env python3

import datetime
import hashlib
import json
import os
import re
import shutil
import signal
import socket
import sys
import traceback
from argparse import ArgumentParser
from importlib import import_module
from pprint import pprint
from time import sleep

import yaml
from bson.objectid import ObjectId
from pymongo import ASCENDING, DESCENDING

from jobmonitor.api import download_code_package, job_by_id, update_job
from jobmonitor.connections import mongo
from jobmonitor.utils import IntervalTimer

"""
This script takes a job_id and it looks in MongoDB for a job with that ID.
It expects something fo the format:

{
	"_id" : ObjectId("5be59ae368999dde8ed9545d"),
	"config" : { "n_layers" : 5 },
	"environment" : {
		"clone" : { "path" : "/mlo-container-scratch/vogels/dev/blabla" },
		"script" : "train.py"
	},
	"user" : "vogels",
	"project" : "sgd",
	"experiment" : "learned_learning_rate",
	"job" : "baseline_fixed_lr",
	"status" : "scheduled"
}

It will
- create an output directory
- clone the code in there,
- import the specified {environment.script}
- override config with job-specific values (in this case n_layers->5)
- run main() from the {environment.script}
"""


is_stopping = False


# Raise SystemExit when SIGTERM is received
signal.signal(signal.SIGTERM, lambda signo, stack_frame: sys.exit(0))


def main():
    parser = ArgumentParser()
    parser.add_argument(
        "job_id", nargs="+", help="List of job ids. Use 'any' to do any work that is left"
    )
    parser.add_argument(
        "--queue-mode",
        "-q",
        default=False,
        action="store_true",
        help='Queue mode: pick a job with status "CREATED" from the job_id list',
    )
    parser.add_argument(
        "--min-worker-count",
        type=int,
        default=None,
        help=(
            "Optimal minimum number of workers for a job to be a candidate for execution by this worker. "
            "Only appliccable in queue mode."
        ),
    )
    parser.add_argument(
        "--mpi", default=False, action="store_true", help="Derive rank and world_size from MPI"
    )
    args = parser.parse_args()

    # Retrieve the job description
    if args.queue_mode:
        query = {
            "$expr": {"$lt": ["$registered_workers", "$n_workers"]},
            "status": {"$in": ["SCHEDULED", "CREATED"]},
        }
        if args.min_worker_count is not None:
            query["n_workers"] = {"$gte": args.min_worker_count}
        if args.job_id != ["any"]:
            query["_id"] = {"$in": [ObjectId(id) for id in args.job_id]}

        job = mongo.job.find_one_and_update(
            query,
            update={
                "$set": {"status": "SCHEDULED", "schedule_time": datetime.datetime.utcnow()},
                "$inc": {"registered_workers": 1},
            },
            sort=[("priority", DESCENDING), ("creation_time", ASCENDING)],
        )
        if job is None:
            print("Queue is empty. Waiting for a task.")
            sleep(10)
            return main()

        job_id = str(job["_id"])
    else:
        job = mongo.job.find_one_and_update(
            {
                "_id": ObjectId(args.job_id[0]),
                "$expr": {"$lt": ["$registered_workers", "$n_workers"]},
                "status": {"$in": ["SCHEDULED", "CREATED"]},
            },
            update={
                "$set": {"status": "SCHEDULED", "schedule_time": datetime.datetime.utcnow()},
                "$inc": {"registered_workers": 1},
            },
            sort=[("priority", DESCENDING), ("creation_time", ASCENDING)],
        )
        if job is None:
            print("Job not found / nothing to do.")
            sys.exit(0)
        job_id = str(job["_id"])

    if not args.mpi:
        rank = job["registered_workers"]
        n_workers = job["n_workers"]
    else:
        rank = int(os.getenv("OMPI_COMM_WORLD_RANK", os.getenv("PMIX_RANK")))
        n_workers = int(os.getenv("OMPI_COMM_WORLD_SIZE", os.getenv("SLURM_NTASKS")))

    # Create an output directory
    output_dir = os.path.join(
        job["project"], job["experiment"], job["job"] + "_" + str(job["_id"])[-6:]
    )
    output_dir_abs = os.path.join(os.getenv("JOBMONITOR_RESULTS_DIR"), output_dir)
    os.makedirs(output_dir_abs, exist_ok=True)
    code_dir = os.path.join(output_dir_abs, "code")

    # Copy the files to run into the output directory
    if rank == 0:
        clone_info = job["environment"]["clone"]
        if "path" in clone_info:
            # fill in any environment variables used in the path
            clone_from = re.sub(
                r"""\$([\w_]+)""", lambda match: os.getenv(match.group(1)), clone_info["path"]
            )
            clone_directory(clone_from, code_dir)
        elif "code_package" in clone_info:
            download_code_package(clone_info["code_package"], code_dir)
        else:
            raise ValueError('Current, only the "path" clone approach is supported')

    # Store hostname and pid so we can find things later
    update_job(
        job_id, {f"workers.{rank}.host": socket.gethostname(), f"workers.{rank}.pid": os.getpid()}
    )

    # Wait for all the workers to reach this point
    barrier("jobstart", job_id, n_workers, desired_statuses=["SCHEDULED", "RUNNING"])

    # Somehow the output directory doesn't seem to exist on all workers.
    # Maybe it needs a little sleep.
    sleep(1)

    # Set job to 'RUNNING' in MongoDB
    if rank == 0:
        update_job(
            job_id,
            {
                "host": socket.gethostname(),
                "status": "RUNNING",
                "start_time": datetime.datetime.utcnow(),
                "output_dir": output_dir,
            },
        )

    def side_thread_fn():
        global is_stopping
        if is_stopping:
            return
        # Check the status of the job and if we need to self-destruct
        res = mongo.job.find_one({"_id": ObjectId(job_id)}, {"status": 1})
        if res is None or res["status"] not in ["SCHEDULED", "RUNNING", "FINISHED"]:
            status = res["status"] if res is not None else "DELETED"
            print(
                f"Job status changed to {status}. This worker will self-destruct.", file=sys.stderr
            )
            os.system("kill %d" % os.getpid())
            is_stopping = True

        # Update the worker's heartbeat
        update_job(
            job_id,
            {
                "last_heartbeat_time": datetime.datetime.utcnow(),
                f"workers.{rank}.last_heartbeat_time": datetime.datetime.utcnow(),
            },
            w=0,
        )

    # Start sending regular heartbeat updates to the db
    # and check whether the job isn't getting canceled
    side_thread_stop, side_thread = IntervalTimer.create(side_thread_fn, 10)
    side_thread.start()

    try:
        # Change directory to the right directory
        os.chdir(code_dir)
        sys.path.insert(0, code_dir)

        # Rewire stdout and stderr to write to the output file
        if rank == 0:
            logfile_path = os.path.join(output_dir_abs, "output.txt")
        else:
            logfile_path = os.path.join(output_dir_abs, f"output.worker{rank}.txt")
        logfile = open(logfile_path, "a")
        print("Starting. Output piped to {}".format(logfile_path))
        orig_stdout = sys.stdout
        orig_stderr = sys.stderr
        sys.stdout = MultiLogChannel(
            MongoLogChannel(mongo.job, job_id, tags={"worker": rank, "type": "info"}),
            sys.stdout,
            FileLogChannel(logfile),
        )
        sys.stderr = MultiLogChannel(
            MongoLogChannel(mongo.job, job_id, tags={"worker": rank, "type": "error"}),
            sys.stderr,
            FileLogChannel(logfile),
        )

        print("cwd: {}".format(code_dir))

        # Import the script specified in the
        script = import_module(job["environment"]["script"].strip(".py"))

        # Override non-default config parameters
        for key, value in job.get("config", {}).items():
            script.config[key] = value
        script.config["rank"] = rank
        script.config["n_workers"] = n_workers
        script.config["distributed_init_file"] = os.path.join(output_dir_abs, "dist_init")

        # Give the script access to all logging facilities
        def log_info(info_dict):
            update_job(job_id, info_dict, w=0)

        # Allows the script to register images
        def log_image(key: str, path: str):
            if path.startswith(output_dir_abs):
                path = path[len(output_dir_abs) + 1 :]
            update_job(job_id, {f"images.{key}": path}, w=0)

        def log_runtime(event, mean_time, std, instances):
            event = event.replace(".", "_")
            update_job(
                job_id,
                {
                    f"timings.{event}.{rank}": {
                        "mean": mean_time,
                        "std": std,
                        "instances": instances,
                    }
                },
                w=0,
            )

        # keep track of which metrics already got an entry in MongoDB
        metrics_created_so_far = set()

        def log_metric(measurement, value, tags={}):
            # Log the metric to MongoDB
            if not isinstance(value, dict):
                value = {"value": value}

            values = {"time": datetime.datetime.utcnow(), **value}
            key_dict = {"measurement": measurement, **tags}

            if n_workers > 1:
                key_dict["worker"] = rank

            key_hash = hashlib.md5(json.dumps(key_dict, sort_keys=True).encode("utf-8")).hexdigest()

            if not key_hash in metrics_created_so_far:
                metrics_created_so_far.add(key_hash)
                mongo.job.update(
                    {"_id": ObjectId(job_id)},
                    {"$push": {f"metrics": {**key_dict, "id": key_hash}}},
                    w=0,
                )
            mongo.job.update(
                {"_id": ObjectId(job_id)}, {"$push": {f"metric_data.{key_hash}": values}}, w=0
            )

        script.log_info = log_info
        script.log_image = log_image
        script.output_dir = output_dir_abs
        script.log_metric = log_metric
        script.log_runtime = log_runtime

        if rank == 0:
            # Store the effective config used in the database
            update_job(job_id, {"config": dict(script.config)})
            # and in the output directory, just to be sure
            with open(os.path.join(output_dir_abs, "config.yml"), "w") as fp:
                yaml.dump(dict(script.config), fp, default_flow_style=False)

        # Run the task
        script.main()

        # Finished successfully
        print("Job finished successfully")
        if rank == 0:
            update_job(job_id, {"status": "FINISHED", "end_time": datetime.datetime.utcnow()})

    except Exception as e:
        error_message = traceback.format_exc()
        print(error_message, file=sys.stderr)
        if isinstance(e, KeyboardInterrupt) or isinstance(e, SystemExit):
            status = "CANCELED"
        else:
            status = "FAILED"
        update_job(
            job_id,
            {
                "status": status,
                "end_time": datetime.datetime.utcnow(),
                "exception": repr(e),
                "traceback": error_message,
                "exception_worker": rank,
            },
        )
    finally:
        global is_stopping
        is_stopping = True
        # Stop the heartbeat thread
        logfile.close()
        sys.stdout = orig_stdout
        sys.stderr = orig_stderr
        side_thread_stop.set()
        side_thread.join(timeout=1)


def clone_directory(from_directory, to_directory, overwrite=True):
    if os.path.isdir(to_directory):
        if overwrite:
            shutil.rmtree(to_directory)
        else:
            raise RuntimeError("Cannot clone to an existing directory.")

    # detect .jobignore file to skip certain patterns
    ignore_file = os.path.join(from_directory, ".jobignore")
    if os.path.isfile(ignore_file):
        with open(ignore_file, "r") as fp:
            ignore_patterns = [p.strip() for p in fp.readlines()]
            ignore_patterns = shutil.ignore_patterns(*ignore_patterns)
    else:
        ignore_patterns = None

    shutil.copytree(from_directory, to_directory, ignore=ignore_patterns)


def barrier(name, job_id, desired_count, poll_interval=2, desired_statuses=None):
    """Wait for all workers to reach this point"""
    if desired_count == 1:
        return

    print(f"Reached barrier {name}")
    # Report that we reached this point
    query = {"_id": ObjectId(job_id)}
    mongo.job.find_one_and_update(query, update={"$inc": {f"barrier.{name}": 1}})

    # Wait until all the workers reached the barrier
    while True:
        res = mongo.job.find_one(query, {f"barrier.{name}": 1, "status": 1})

        if res is None:
            sys.exit(1)

        if desired_statuses is not None and res["status"] not in desired_statuses:
            print(f"Status is not in expected statuses {desired_statuses}. Exiting")
            sys.exit(1)

        count = res.get("barrier", {}).get(name, 0)
        if count >= desired_count:
            print("... all workers registered. time to continue.")
            break
        else:
            print(f"... workers registered: {count} / {desired_count}")
            sleep(poll_interval)


class MultiLogChannel:
    def __init__(self, *channels):
        self.channels = channels

    def write(self, message, flush=True):
        for channel in self.channels:
            channel.write(message)
        if flush:
            self.flush()

    def flush(self):
        for channel in self.channels:
            channel.flush()

    def isatty(self):
        return all(c.isatty() for c in self.channels)


class FileLogChannel:
    """Replacement for channels sys.stdout and sys.stderr to write logs in MongoDB"""

    def __init__(self, file_pointer):
        self.logfile = file_pointer

    def write(self, message):
        try:
            if self.logfile is not None:
                self.logfile.write(message)
                self.logfile.flush()
        except OSError:
            pass

    def flush(self):
        pass

    def isatty(self):
        return False


class MongoLogChannel:
    """Replacement for channels sys.stdout and sys.stderr to write logs in MongoDB"""

    def __init__(self, db, job_id, field="logs", tags={}):
        self.db = db
        self.job_id = job_id
        self.field = field
        self.tags = tags

    def write(self, message):
        if message.strip() != "":
            self.db.update(
                {"_id": ObjectId(self.job_id)},
                {
                    "$push": {
                        self.field: {
                            **self.tags,
                            "message": message.strip(),
                            "time": datetime.datetime.utcnow(),
                        }
                    }
                },
                w=0,
            )

    def flush(self):
        pass

    def isatty(self):
        return False


if __name__ == "__main__":
    main()
