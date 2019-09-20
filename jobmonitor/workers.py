#!/usr/bin/env python3

import datetime
import os
import sys
from argparse import ArgumentParser

import yaml
from bson.objectid import ObjectId

from jobmonitor.connections import mongo


"""
Show a job's worker status
"""


def main():
    parser = ArgumentParser()
    parser.add_argument("job_id", help="ID of the job")
    args = parser.parse_args()

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

    worker_tuples = [(int(rank), data) for rank, data in job.get("workers", {}).items()]
    for rank, data in sorted(worker_tuples):
        host = data["host"]
        pid = data["pid"]
        heartbeat = data["last_heartbeat_time"].strftime("%Y-%m-%d %H:%M:%S")
        heartbeat_diff = datetime.datetime.utcnow() - data["last_heartbeat_time"]
        dead = heartbeat_diff > datetime.timedelta(seconds=10)
        if dead:
            heartbeat = fg(heartbeat, 1)
        print(f"{rank:2d} - {host} @ {pid} - heartbeat {heartbeat}")


fg = lambda text, color: "\33[38;5;" + str(color) + "m" + str(text) + "\33[0m"
bg = lambda text, color: "\33[48;5;" + str(color) + "m" + str(text) + "\33[0m"


if __name__ == "__main__":
    main()
