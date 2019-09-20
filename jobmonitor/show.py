#!/usr/bin/env python3

import os
import sys
from argparse import ArgumentParser

import yaml

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

    if not args.config:
        del job["config"]

    if "logs" in job:
        del job["logs"]

    if "metric_data" in job:
        del job["metric_data"]

    job["id"] = str(job.pop("_id"))

    del job["environment"]  # too lazy to fix a bug

    print(yaml.safe_dump(job))


if __name__ == "__main__":
    main()
