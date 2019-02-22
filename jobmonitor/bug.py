#!/usr/bin/env python3

from bson.objectid import ObjectId

import jobmonitor.delete
from jobmonitor.connections import mongo


"""
Kill a job if it is running on kubernetes
"""


def bug(job_id):
    mongo.job.update_one(
        {'_id': ObjectId(job_id)},
        {'$set': {'annotations.bug': True}}
    )


def main():
    jobmonitor.delete.main(bug, action_name='mark buggy')


if __name__ == '__main__':
    main()
