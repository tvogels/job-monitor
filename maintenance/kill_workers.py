#!/usr/bin/env python3

"""
This force-kills all workers running a job.
In a multi-worker setting, just deleting a job can lead to deadlock,
when a worker is waiting for repsonse from the others forever.
"""

import subprocess
from argparse import ArgumentParser

from bson import ObjectId

from jobmonitor.connections import mongo


def main():
    parser = ArgumentParser()
    parser.add_argument("id")
    args = parser.parse_args()

    res = mongo.job.find_one({"_id": ObjectId(args.id)}, {"workers": 1})

    if res is None:
        print("Not found")
    else:
        for worker in res["workers"].values():
            print(worker["host"], worker["pid"])
            try:
                subprocess.check_call(
                    ["ssh", worker["host"], "--", "kill", "-9", str(worker["pid"])]
                )
            except subprocess.CalledProcessError:
                pass


if __name__ == "__main__":
    main()
