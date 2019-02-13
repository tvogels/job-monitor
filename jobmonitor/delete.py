#!/usr/bin/env python3

import os
import shutil
from argparse import ArgumentParser

import kubernetes
from bson.objectid import ObjectId

from jobmonitor.api import delete_job_by_id, job_by_id, kubernetes_delete_job
from jobmonitor.connections import KUBERNETES_NAMESPACE, influx, mongo


"""
Delete all traces of a previously scheduled job (kubernetes, mongodb, influxdb, filesystem)
"""

def delete_job(job_id):
    print('# Job', job_id)
    kill_result = kill_job_in_kubernetes(job_id)

    influx.query("DELETE WHERE job_id='{}'".format(job_id))
    print('- Deleted all traces of this job id in InfluxDB')

    job = job_by_id(job_id)
    if job:
        if 'output_dir' in job:
            output_dir = job['output_dir']
            shutil.rmtree(os.path.join(os.getenv('JOBMONITOR_RESULTS_DIR'), job['output_dir']))
            print('- Cleared output directory {}'.format(output_dir))

        delete_job_by_id(job_id)
        print('- Deleted entry in MongoDB')
        print('\n')
    else:
        print('- No MongoDB entry found')


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

    if name:
        print('- Killed job {} in Kubernetes'.format(name))

    return name


def main(delete_fn=delete_job, action_name='delete'):
    parser = ArgumentParser()
    parser.add_argument('job_ids', nargs='*', help='IDs of the jobs to be removed.')
    parser.add_argument('--job')
    parser.add_argument('--experiment')
    parser.add_argument('--status')
    args = parser.parse_args()

    to_be_deleted = args.job_ids

    query = {}
    if args.experiment is not None:
        query['experiment'] = args.experiment
    if args.job is not None:
        query['job'] = {"$regex": args.job}
    if args.status is not None:
        query['status'] = args.status

    if query != {}:
        for job in mongo.job.find(query, {}):
            to_be_deleted.append(str(job['_id']))

    if len(to_be_deleted) == 0:  # if query matches no jobs or no job_ids provided
        print('No jobs found that match the provided criteria.')
        sys.exit(1)

    print('Should I {}:'.format(action_name))
    for id in to_be_deleted:
        job = job_by_id(id)
        print("- {experiment} / {job} -- {status}".format(**job))

    answer = None
    while answer not in ['Y', 'y', 'N','n', '']:
        answer = input('Please confirm [Y/n]: ')

    if answer.lower() == 'n':
        print('Canceled ...')
    else:
        for job_id in to_be_deleted:
            delete_fn(job_id)


if __name__ == '__main__':
    main()
