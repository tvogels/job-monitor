#!/usr/bin/env python3

import hashlib
import json

from bson.objectid import ObjectId

from jobmonitor.api import influx_query
from jobmonitor.connections import mongo

# Make a list of all jobs in MongoDB
ids = set()
for item in mongo.job.find({}, {"_id": 1}):
    ids.add(str(item["_id"]))

# For each job, find its timeseries
for job_id in [
    "5c92253695b4a72d7ff957fc",
    "5c6295280d07769dc1f72c1b",
    "5c6295280d07769dc1f72c1a",
    "5c6295280d07769dc1f72c1d",
    "5c6295280d07769dc1f72c17",
    "5cd5a701f772038be1ea0ed2",
]:

    # print(job_id)

    mongo.job.update_one({"_id": ObjectId(job_id)}, {"$unset": {"metrics": 1, "metric_data": 1}})

    res = influx_query(f"SHOW MEASUREMENTS WHERE job_id='{job_id}'", merge=True)
    if res is None:
        continue
    measurements = res.name

    for measurement in measurements:
        for (measurement, tags, data) in influx_query(
            f"SELECT * FROM \"{measurement}\" WHERE job_id='{job_id}' GROUP BY *"
        ):
            try:
                for tag_key in tags.keys():
                    del data[tag_key]
                del data["measurement"]
                del tags["influxdb_database"]
                del tags["job"]
                del tags["job_id"]
                del tags["experiment"]
                del tags["user"]
                del tags["project"]
                del tags["host"]
                tags["measurement"] = measurement

                # print("-", tags)

                key_hash = hashlib.md5(json.dumps(tags, sort_keys=True).encode("utf-8")).hexdigest()

                mongo.job.update_one(
                    {"_id": ObjectId(job_id)}, {"$push": {f"metrics": {**tags, "id": key_hash}}}
                )

                data.dropna(axis=1, inplace=True)

                values = []
                for idx, dta in data.iterrows():
                    dta = dta.to_dict()
                    values.append(dta)

                mongo.job.update_one(
                    {"_id": ObjectId(job_id)}, {"$set": {f"metric_data.{key_hash}": values}}
                )
            except Exception as e:
                print(f"Error {job_id} - {tags}")
