#!/usr/bin/env python3

import datetime
import os
import re
import shutil
import socket
import sys
import traceback
from argparse import ArgumentParser
from importlib import import_module
from pprint import pprint
from time import sleep

import yaml
from bson.objectid import ObjectId
from telegraf.client import TelegrafClient

from jobmonitor.connections import mongo
from jobmonitor.api import job_by_id, update_job, download_code_package
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
    args = parser.parse_args()

    # Retrieve the job description
    if args.queue_mode:
        query = {
            "$expr": {"$lt": ["$registered_workers", "$n_workers"]},
            "status": {"$in": ["SCHEDULED", "CREATED"]},
        }
        if args.job_id != ["any"]:
            query["_id"] = {"$in": [ObjectId(id) for id in args.job_id]}

        job = mongo.job.find_and_modify(
            query=query,
            update={
                "$set": {"status": "SCHEDULED", "schedule_time": datetime.datetime.utcnow()},
                "$inc": {"registered_workers": 1},
            },
            sort={"registered_workers": -1, "priority": -1},
        )
        if job is None:
            print("Queue is empty. Waiting for a task.")
            sleep(10)
            return main()

        job_id = str(job["_id"])
    else:
        job = mongo.job.find_and_modify(
            query={
                "_id": ObjectId(args.job_id[0]),
                "$expr": {"$lt": ["$registered_workers", "$n_workers"]},
                "status": {"$in": ["SCHEDULED", "CREATED"]},
            },
            update={
                "$set": {"status": "SCHEDULED", "schedule_time": datetime.datetime.utcnow()},
                "$inc": {"registered_workers": 1},
            },
            sort={"registered_workers": -1, "priority": -1},
        )
        if job is None:
            print("Job not found / nothing to do.")
            sys.exit(0)
        job_id = str(job["_id"])

    rank = job["registered_workers"]
    n_workers = job["n_workers"]

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
    update_job(job_id, {f"workers.{rank}": {"host": socket.gethostname(), "pid": os.getpid()}})

    # Wait for all the workers to reach this point
    barrier("jobstart", job_id, n_workers, desired_status="RUNNING")

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

    # Create a telegraf client
    telegraf = TelegrafClient(
        host=os.getenv("JOBMONITOR_TELEGRAF_HOST"),
        port=int(os.getenv("JOBMONITOR_TELEGRAF_PORT")),
        tags={  # global tags for this experiment
            "host": socket.gethostname(),
            "user": job["user"],
            "job_id": job_id,
            "project": job["project"],
            "experiment": job["experiment"],
            "job": job["job"],
        },
    )

    # Start sending regular heartbeat updates to the db
    heartbeat_stop, heartbeat_thread = IntervalTimer.create(
        lambda: update_job(
            job_id,
            {
                "last_heartbeat_time": datetime.datetime.utcnow(),
                f"workers.{rank}.last_heartbeat_time": datetime.datetime.utcnow(),
            },
        ),
        10,
    )
    heartbeat_thread.start()

    try:
        # Change directory to the right directory
        os.chdir(code_dir)
        sys.path.append(code_dir)

        # Rewire stdout and stderr to write to the output file
        if rank == 0:
            logfile_path = os.path.join(output_dir_abs, "output.txt")
        else:
            logfile_path = os.path.join(output_dir_abs, f"output.worker{rank}.txt")
        logfile = open(logfile_path, "a")
        print("Starting. Output piped to {}".format(logfile_path))
        sys.stdout = PipeToFile(sys.stdout, logfile)
        sys.stderr = PipeToFile(sys.stderr, logfile)

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
            update_job(job_id, info_dict)

        # Allows the script to register images
        def log_image(key: str, path: str):
            if path.startswith(output_dir_abs):
                path = path[len(output_dir_abs) + 1 :]
            update_job(job_id, {f"images.{key}": path})

        script.log_info = log_info
        script.log_image = log_image
        script.output_dir = output_dir_abs
        script.log_metric = telegraf.metric

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
        print(error_message)
        print("Job failed. See {}".format(logfile_path))
        print(error_message)
        if isinstance(e, KeyboardInterrupt):
            status = "CANCELED"
        else:
            status = "FAILED"
        update_job(
            job_id, {"status": status, "end_time": datetime.datetime.utcnow(), "exception": repr(e)}
        )

    finally:
        # Stop the heartbeat thread
        heartbeat_stop.set()
        heartbeat_thread.join(timeout=1)
        sys.stdout.close_logfile()
        sys.stdout = sys.stdout.channel
        sys.stderr.close_logfile()
        sys.stderr = sys.stderr.channel


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


def barrier(name, job_id, desired_count, poll_interval=2, desired_status=None):
    """Wait for all workers to reach this point"""
    if desired_count == 1:
        return

    print(f"Reached barrier {name}")
    # Report that we reached this point
    query = {"_id": ObjectId(job_id)}
    mongo.job.find_and_modify(query=query, update={"$inc": {f"barrier.{name}": 1}})

    # Wait until all the workers reached the barrier
    while True:
        res = mongo.job.find_one(query, {f"barrier.{name}": 1, "status": 1})

        if desired_status is not None and res["status"] != desired_status:
            print(f"Status is not the expected {desired_status}. Exiting")
            sys.exit(1)

        count = res.get("barrier", {}).get(name, 0)
        if count >= desired_count:
            print("... all workers registered. time to continue.")
            break
        else:
            print(f"... workers registered: {count} / {desired_count}")
            sleep(poll_interval)


class PipeToFile:
    """Change sys.stdout or sys.stderr to output to a file in addition to the normal channel"""

    def __init__(self, channel, file_pointer):
        self.channel = channel
        self.logfile = file_pointer

    def write(self, message):
        self.channel.write(message)
        if self.logfile is not None:
            self.logfile.write(message)
            self.logfile.flush()

    def flush(self):
        self.channel.flush()
        if self.logfile is not None:
            self.logfile.flush()

    def close_logfile(self):
        self.logfile.close()
        self.logfile = None


if __name__ == "__main__":
    main()
