from jobmonitor.connections import mongo
from bson.objectid import ObjectId

def job_by_id(job_id):
    return mongo.job.find_one({ '_id': ObjectId(job_id) })


def delete_job_by_id(job_id):
    return mongo.job.delete_one({ '_id': ObjectId(job_id) })
