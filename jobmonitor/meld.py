#!/usr/bin/env python3

import os
import sys
from argparse import ArgumentParser

import yaml
import tempfile
import subprocess

from jobmonitor.api import download_code_package, job_by_id

"""
Compare the code of two jobs
"""


def main():
    parser = ArgumentParser()
    parser.add_argument("job1", type=str)
    parser.add_argument("job2", type=str)
    args = parser.parse_args()

    job1 = job_by_id(args.job1)
    job2 = job_by_id(args.job2)

    with tempfile.TemporaryDirectory() as tempdir:
        directories = []
        for i, job in enumerate([job1, job2]):
            code_dir = os.path.join(tempdir, f"job{i}")
            directories.append(code_dir)
            clone_info = job["environment"]["clone"]
            download_code_package(clone_info["code_package"], code_dir)
        subprocess.call(["meld"] + directories)


if __name__ == "__main__":
    main()
