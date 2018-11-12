#!/usr/bin/env python3

import datetime
import os
import re
import shutil
import socket
import sys
import traceback
from argparse import ArgumentParser
from importlib import import_module
from pprint import pprint
from time import sleep

import yaml
from bson.objectid import ObjectId
from pymongo import MongoClient
from telegraf.client import TelegrafClient

from jobmonitor.utils import IntervalTimer


"""
This script takes a job_id and it looks in MongoDB for a job with that ID.
It expects something fo the format:

{
	"_id" : ObjectId("5be59ae368999dde8ed9545d"),
	"config" : { "n_layers" : 5 },
	"initialization" : {
		"clone" : { "path" : "/mlo-container-scratch/vogels/dev/blabla" },
		"script" : "train.py"
	},
	"user" : "vogels",
	"project" : "sgd",
	"experiment" : "learned_learning_rate",
	"job" : "baseline_fixed_lr",
	"status" : "scheduled"
}

It will
- create an output directory
- clone the code in there,
- import the specified {initialization.script}
- override config with job-specific values (in this case n_layers->5)
- run main() from the {initialization.script}
"""

def main():
    mongo = getattr(MongoClient(host=os.getenv('JOBMONITOR_METADATA_HOST'), port=int(os.getenv('JOBMONITOR_METADATA_PORT'))), os.getenv('JOBMONITOR_METADATA_DB'))
    telegraf = TelegrafClient(host=os.getenv('JOBMONITOR_TELEGRAF_HOST'), port=os.getenv('JOBMONITOR_TELEGRAF_PORT'))

    parser = ArgumentParser()
    parser.add_argument('job_id')
    args = parser.parse_args()
    this_job = {'_id': ObjectId(args.job_id)}

    # Retrieve the job description
    job = mongo.job.find_one({'_id': ObjectId(args.job_id)})

    # Create an output directory
    output_dir = os.path.join(job['project'], job['experiment'], job['job'] + '_' + str(job['_id'])[-6:])
    output_dir_abs = os.path.join(os.getenv('JOBMONITOR_RESULTS_DIR'), output_dir)
    os.makedirs(output_dir_abs, exist_ok=True)
    code_dir = os.path.join(output_dir_abs, 'code')

    # Set job to 'started' in MongoDB
    mongo.job.update(
        this_job,
        {'$set': {
            'host': socket.gethostname(),
            'status': 'running',
            'start_time': datetime.datetime.utcnow(),
            'output_dir': output_dir,
        }}
    )

    # Copy the files to run into the output directory
    clone_info = job['initialization']['clone']
    if 'path' in clone_info:
        if os.path.isdir(code_dir):
            shutil.rmtree(code_dir)

        # fill in any environment variables used in the path
        clone_from = re.sub(
            r"""\$([\w_]+)""",
            lambda match: os.getenv(match.group(1)),
            clone_info['path']
        )

        shutil.copytree(clone_from, code_dir)
    else:
        raise ValueError('Current, only the "path" clone approach is supported')

    # Create a telegraf client
    telegraf = TelegrafClient(
        host=os.getenv('JOBMONITOR_TELEGRAF_HOST'),
        port=int(os.getenv('JOBMONITOR_TELEGRAF_PORT')),
        tags={ # global tags for this experiment
            'host': socket.gethostname(),
            'user': job['user'],
            'job_id': str(job['_id']),
            'project': job['project'],
            'experiment': job['experiment'],
            'job': job['job']
        }
    )

    # Change directory to the right directory
    os.chdir(code_dir)
    sys.path.append(code_dir)

    # Rewire stdout and stderr to write to the output file
    orig_stdout = sys.stdout
    logfile_path = os.path.join(output_dir_abs, 'output')
    logfile = open(logfile_path, 'w')
    print("Starting. Output redirected to {}".format(logfile_path))
    sys.stdout = logfile
    sys.stderr = logfile

    print("cwd: {}".format(code_dir))

    try:
        # Import the script specified in the
        script = import_module(job['initialization']['script'].strip('.py'))

        # Override non-default config parameters
        for key, value in job.get('config', {}).items():
            script.config[key] = value

        # Give the script access to all logging facilities
        def log_info(info_dict):
            mongo.job.update(
                this_job,
                {"$set": info_dict}
            )
        script.log_info = log_info
        script.output_dir = output_dir_abs
        script.log_metric = telegraf.metric

        # Store the effective config used in the database
        mongo.job.update(
            this_job,
            {"$set": {"config": script.config}}
        )
        # and in the output directory, just to be sure
        with open(os.path.join(output_dir_abs, 'config.yml'), 'w') as fp:
            yaml.dump(script.config, fp, default_flow_style=False)

        # Heartbeat
        def send_heartbeat():
            mongo.job.update(
                this_job,
                {"$set": {"last_heartbeat_time": datetime.datetime.utcnow()}}
            )
        heartbeat_stop, heartbeat_thread = IntervalTimer.create(send_heartbeat, 10)
        heartbeat_thread.start()

        # Run the task
        script.main()

        heartbeat_stop.set()
        heartbeat_thread.join(2)

        # Finished successfully
        sys.stdout = orig_stdout
        print('Job finished successfully')
        mongo.job.update(this_job, { '$set': { 'status': 'finished', 'end_time': datetime.datetime.utcnow() } })

    except Exception as e:
        error_message = traceback.format_exc()
        print(error_message)
        sys.stdout = orig_stdout
        print('Job failed. See {}'.format(logfile_path))
        print(error_message)
        mongo.job.update(this_job, { '$set': { 'status': 'failed', 'end_time': datetime.datetime.utcnow(), 'exception': repr(e) } })
        sys.exit()

if __name__ == '__main__':
    main()
