#!/usr/bin/env python3

import os
import sys
import datetime
from argparse import ArgumentParser

import json

from jobmonitor.api import job_by_id


"""
Show a job's DB entry in YAML format
"""


def main():
    parser = ArgumentParser()
    parser.add_argument("job_id", help="ID of the job")
    parser.add_argument("-c", "--config", help="With config", action="store_true", default=False)
    args = parser.parse_args()

    job = job_by_id(args.job_id)

    if job is None:
        print("Job not found.")
        sys.exit(1)

    if "config" in job and not args.config:
        del job["config"]

    if "logs" in job:
        del job["logs"]

    if "metric_data" in job:
        del job["metric_data"]

    if "timings" in job:
        del job["timings"]

    job["id"] = str(job.pop("_id"))

    if "last_heartbeat_time" in job:
        job["duration"] = str(job["last_heartbeat_time"] - job["start_time"])

    del job["environment"]  # too lazy to fix a bug

    maxlen = max(len(k) for k in job.keys())

    def sortkey(key):
        first = [
            "user",
            "project",
            "experiment",
            "job",
            "id",
            "status",
            "host",
            "state",
            "annotations",
        ]
        if key in first:
            idx = first.index(key)
            return f"0 {idx:03x}{key}"
        if "time" in key:
            return "1 " + key
        if "duration" in key:
            return "2 " + key
        if "workers" in key:
            return "4 " + key
        if "barrier" in key:
            return "5 " + key
        return "3 " + key

    for key in sorted(job.keys(), key=sortkey):
        value = job[key]
        if isinstance(value, datetime.datetime):
            value = str(value)
        elif isinstance(value, str):
            value = value
        elif isinstance(value, float):
            value = value
        elif isinstance(value, int):
            value = value
        else:
            value = json.dumps(value)

        spaces = " " * (maxlen - len(key))
        padded_key = key + ":" + spaces
        print(f"{padded_key} {value}")


if __name__ == "__main__":
    main()
