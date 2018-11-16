#!/usr/bin/env python3

import os
import shutil
from argparse import ArgumentParser

from jobmonitor.api import job_by_id, delete_job_by_id
from jobmonitor.kill import kill_job_in_kubernetes
from jobmonitor.connections import influx

"""
Delete all traces of a previously scheduled job (kubernetes, mongodb, influxdb, filesystem)
"""

def main():
    parser = ArgumentParser()
    parser.add_argument('job_ids', nargs='+', help='IDs of the jobs to be removed.')
    args = parser.parse_args()

    for job_id in args.job_ids:
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
