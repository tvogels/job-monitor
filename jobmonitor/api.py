import os

from bson.objectid import ObjectId

from jobmonitor.connections import mongo


def job_by_id(job_id):
    return mongo.job.find_one({ '_id': ObjectId(job_id) })


def delete_job_by_id(job_id):
    return mongo.job.delete_one({ '_id': ObjectId(job_id) })


def result_dir(job):
    root_dir = os.getenv('JOBMONITOR_RESULTS_DIR')
    if type(job) == str:
        job = job_by_id(job)
    return os.path.join(root_dir, job['output_dir'])
