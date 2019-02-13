#!/usr/bin/env python3

import os
import sys
from argparse import ArgumentParser

import yaml

from jobmonitor.connections import mongo

"""
Lists either all jobs or jobs with a given status in YAML format.
"""

def main():
    parser = ArgumentParser()
    parser.add_argument('--status', help='Only show jobs with given status.', type=str)
    parser.add_argument('-c', '--config', help='With config', action='store_true', default=False)
    args = parser.parse_args()

    if args.status:
        jobs = mongo.job.find({'status': args.status})
    else:
        jobs = mongo.job.find()

    if jobs is None:
        print("No jobs found.")
        sys.exit(1)

    for job in jobs:
        job['id'] = str(job.pop('_id'))
        print(yaml.safe_dump(job))


if __name__ == '__main__':
    main()