#!/usr/bin/env python3

import os
import sys
from argparse import ArgumentParser

import yaml
from bson.objectid import ObjectId

from jobmonitor.connections import mongo


"""
Show a job's logs
"""


def main():
    parser = ArgumentParser()
    parser.add_argument("job_id", help="ID of the job")
    parser.add_argument("-w", "--worker", help="Only show this worker", type=int)
    parser.add_argument("-t", "--tail", type=int)
    args = parser.parse_args()

    job = mongo.job.find_one({"_id": ObjectId(args.job_id)}, {"logs": 1})

    if job is None:
        print(fg("Job not found.", 1))
        sys.exit(1)

    lines = job.get("logs", [])

    lines = filter(lambda l: l["message"].strip() != "", lines)

    if args.worker is not None:
        lines = filter(lambda l: l["worker"] == args.worker, lines)

    if args.tail is not None:
        lines = list(lines)
        lines = lines[-args.tail :]

    for line in lines:
        if args.worker is None:
            print(fg("%02d" % line["worker"], 0), end=" ")
        print(fg(line["time"].strftime("%Y-%m-%d %H:%M:%S"), 0), end=" ")
        if line["type"] == "error":
            print(fg(line["message"].strip(), 1))
        else:
            print(line["message"].strip())


fg = lambda text, color: "\33[38;5;" + str(color) + "m" + text + "\33[0m"
bg = lambda text, color: "\33[48;5;" + str(color) + "m" + text + "\33[0m"


if __name__ == "__main__":
    main()
