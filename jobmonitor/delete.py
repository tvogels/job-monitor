#!/usr/bin/env python3

import os
import shutil
from argparse import ArgumentParser

from jobmonitor.api import delete_job_by_id, job_by_id
from jobmonitor.connections import influx, mongo
from jobmonitor.kill import kill_job_in_kubernetes


"""
Delete all traces of a previously scheduled job (kubernetes, mongodb, influxdb, filesystem)
"""

def main():
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

    print('Should I delete:')
    for id in to_be_deleted:
        job = job_by_id(id)
        print("- {experiment} / {job} -- {status}".format(**job))

    answer = None
    while answer not in ['y', 'n', '']:
        answer = input('Please confirm [Y/n]: ')

    if answer == 'n':
        print('Canceled ...')
    else:
        for job_id in to_be_deleted:
            delete_job(job_id)


def delete_job(job_id):
    print('# Job', job_id)
    kill_result = kill_job_in_kubernetes(job_id)
    if kill_result:
        print('- Killed job {} in Kubernetes'.format(kill_result))

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

if __name__ == '__main__':
    main()
