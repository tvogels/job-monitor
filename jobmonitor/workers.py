#!/usr/bin/env python3

import datetime
import sys
from argparse import ArgumentParser

from bson.objectid import ObjectId


"""
Show a job's worker status
"""


def main():
    parser = ArgumentParser()
    parser.add_argument("job_id", help="ID of the job")
    args = parser.parse_args()

    from jobmonitor.connections import mongo

    job = mongo.job.find_one(
        {"_id": ObjectId(args.job_id)}, {"workers": 1, "registered_workers": 1, "n_workers": 1}
    )

    if job is None:
        print(fg("Job not found.", 1))
        sys.exit(1)

    print(
        "Registered workers: {} out of {}\n".format(
            fg(job["registered_workers"], 2), fg(job["n_workers"], 2)
        )
    )

    if "workers" in job and job["workers"] is not None:
        worker_tuples = [(int(rank), data) for rank, data in job.get("workers", {}).items()]
    else:
        worker_tuples = []

    for rank, data in sorted(worker_tuples):
        host = data["host"]
        pid = data["pid"]
        if "last_heartbeat_time" in data:
            heartbeat = data["last_heartbeat_time"].strftime("%Y-%m-%d %H:%M:%S")
            heartbeat_diff = datetime.datetime.utcnow() - data["last_heartbeat_time"]
            dead = heartbeat_diff > datetime.timedelta(seconds=20)
            if dead:
                heartbeat = fg(heartbeat, 1)
        else:
            heartbeat = None
        print(f"{rank:2d} - {host} @ {pid} - heartbeat {heartbeat}")


fg = lambda text, color: "\33[38;5;" + str(color) + "m" + str(text) + "\33[0m"
bg = lambda text, color: "\33[48;5;" + str(color) + "m" + str(text) + "\33[0m"


if __name__ == "__main__":
    main()
