#!/usr/bin/env python3

import os
from argparse import ArgumentParser

import kubernetes
from bson.objectid import ObjectId

from jobmonitor.connections import KUBERNETES_NAMESPACE, mongo
from jobmonitor.api import kubernetes_delete_job


"""
Kill a job if it is running on kubernetes
"""

def main():
    parser = ArgumentParser()
    parser.add_argument('job_ids', nargs='+', help='IDs of the jobs to be removed.')
    args = parser.parse_args()

    for job_id in args.job_ids:
        if kill_job_in_kubernetes(job_id):
            print('Killed job', job_id)
        else:
            print('Job', job_id, 'was not running')


def kill_job_in_kubernetes(job_id):
    kubernetes.config.load_kube_config()
    client = kubernetes.client.BatchV1Api()
    job_results = client.list_namespaced_job(KUBERNETES_NAMESPACE, label_selector="job_id="+job_id)
    if not job_results.items:
        return False

    job = job_results.items[0]
    name = job.metadata.name
    kubernetes_delete_job(name)

    # Set status to CANCELED in MongoDB if the job is still RUNNING
    mongo.job.update({ '_id': ObjectId(job_id), 'status': 'RUNNING' }, { '$set': { 'status': 'CANCELED' } })
    return name


if __name__ == '__main__':
    main()
