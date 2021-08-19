#!/usr/bin/env python3

import sys
from argparse import ArgumentParser

from bson.objectid import ObjectId


"""
Show a job's timing data
"""


def main():
    parser = ArgumentParser()
    parser.add_argument("job_id", help="ID of the job")
    parser.add_argument("--worker", "-w", help="Which worker? default: mean")
    args = parser.parse_args()

    from jobmonitor.connections import mongo

    job = mongo.job.find_one({"_id": ObjectId(args.job_id)}, {"timings": 1})

    if job is None:
        print(fg("Job not found.", 1))
        sys.exit(1)

    import pandas as pd

    timings = job.get("timings", {})

    entries = []
    for event, data in timings.items():
        for worker_rank, stats in data.items():
            entries.append({"event": event, "worker": worker_rank, **stats})

    df = pd.DataFrame(entries)

    df["time"] = df["mean"] * df["instances"]

    del df["std"]

    with pd.option_context("display.max_rows", None):
        if not args.worker:
            print(df.groupby("event").agg("mean"))
        else:
            print(f"Worker {args.worker}")
            print(df[df.worker == args.worker].drop(["worker"], axis=1))


if __name__ == "__main__":
    main()
