#!/usr/bin/env python3

from bson.objectid import ObjectId

import jobmonitor.delete
from jobmonitor.connections import mongo


"""
Kill a job if it is running on kubernetes
"""


def star(job_id):
    mongo.job.update_one({"_id": ObjectId(job_id)}, {"$set": {"annotations.star": True}})


def main():
    jobmonitor.delete.main(star, action_name="star")


if __name__ == "__main__":
    main()
