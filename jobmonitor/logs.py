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
    args = parser.parse_args()

    job = mongo.job.find_one({"_id": ObjectId(args.job_id)}, {"logs": 1})

    for line in job.get("logs", []):
        if line["message"].strip() == "":
            continue
        if args.worker is not None:
            if line["worker"] != args.worker:
                continue
        else:
            print(fg("%02d" % line["worker"], 1), end=" ")
        print(fg(line["time"].strftime("%Y-%m-%d %H:%M:%S"), 0), end=" ")
        print(line["message"].strip())


fg = lambda text, color: "\33[38;5;" + str(color) + "m" + text + "\33[0m"
bg = lambda text, color: "\33[48;5;" + str(color) + "m" + text + "\33[0m"


if __name__ == "__main__":
    main()
