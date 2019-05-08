#!/usr/bin/env python3

import jobmonitor.delete


"""
Kill a job if it is running on kubernetes
"""


def main():
    jobmonitor.delete.main(jobmonitor.delete.kill_workers, action_name="kill")


if __name__ == "__main__":
    main()
