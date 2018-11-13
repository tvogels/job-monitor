#!/usr/bin/env python3

import datetime
import os
import subprocess
import tempfile
from argparse import ArgumentParser

import jinja2
from jsonschema import validate
import yaml
from pymongo import MongoClient


"""
This creates job specifications in MongoDB and
starts running these jobs on the cluster.
"""

def main():
    parser = ArgumentParser()
    parser.add_argument('specification', help='File describing the jobs to be scheduled in the YAML format')
    parser.add_argument('-m', '--manual-scheduling', default=False, action='store_true', help='If set, we will just create the jobs, but not start them on a worker.')
    args = parser.parse_args()

    # Connect to MongoDB
    # This database is central in communicating the task to the worker
    # We will store the task in the database and send just the job id to a worker for execution.
    mongo = getattr(MongoClient(host=os.getenv('JOBMONITOR_METADATA_HOST'), port=int(
        os.getenv('JOBMONITOR_METADATA_PORT'))), os.getenv('JOBMONITOR_METADATA_DB'))

    # Load the YAML document specifying how the
    specification = yaml.load(open(args.specification, 'r'))
    validate(specification, SPECIFICATION_SCHEMA)

    if 'kubernetes' in specification:
        # Load a template for the kubernetes job definition file
        with open(specification['kubernetes']['job_template'], 'r') as fp:
            job_template = jinja2.Template(fp.read())
    else:
        args.manual_scheduling = True

    # Create tasks and job descriptions
    job_ids = {}
    for job_spec in specification['jobs']:
        job_content = {
            'user': specification['user'],
            'project': specification['project'],
            'experiment': specification['experiment'],
            'job': job_spec['name'],
            'config': job_spec['config'],
            'environment': specification['environment'],
            'scheduled_date': datetime.datetime.utcnow(),
            'status': 'scheduled',
        }
        if 'annotations' in job_spec:
            job_content['annotations'] = job_spec['annotations']

        # Insert into the DB
        insert_result = mongo.job.insert_one(job_content)
        job_id = str(insert_result.inserted_id)
        job_ids[job_spec['name']] = job_id

        if not args.manual_scheduling:
            # Create a kubernetes job
            kubernetes_job = job_template.render({
                **job_content,
                'id_short': job_id[-6:],
                'id': job_id,
                'resources': specification['kubernetes'].get('resources', {})
            })
            try:
                f = tempfile.NamedTemporaryFile('w', suffix='.yaml', delete=False)
                f.write(kubernetes_job)
                f.close()
                subprocess.check_output(['kubectl', 'create', '-f', f.name])
            finally:
                os.unlink(f.name)


    # Pretty-print the created job ids
    print('Created {} jobs entries in the database:'.format(len(job_ids)))
    max_len = max(len(x) for x in job_ids) + 1
    for job_name, job_id in job_ids.items():
        job_name = job_name + "".join([" "] * (max_len - len(job_name)))
        print("{}: {}".format(job_name, job_id))

    if args.manual_scheduling:
        print('Run the jobs on a worker with `jobrun $jobid`.')
    else:
        print('Jobs have been scheduled on the container cluster.')


SPECIFICATION_SCHEMA = yaml.load("""
type: object
required: [user, project, experiment, jobs, environment]
additionalProperties: false
properties:
  user: { type: string }
  project: { type: string }
  experiment: { type: string }
  jobs:
    type: array
    items:
      type: object
      required: [name, config]
      additionalProperties: false
      properties:
        name: { type: string }
        config: { type: object }
        annotations:
          type: object
          properties:
            description: { type: string }
  environment:
    type: object
    required: [clone, script]
    additionalProperties: false
    properties:
      clone:
        type: object
        required: [path]
        additionalProperties: false
        properties:
          path: { type: string }
      script: { type: string }
  kubernetes:
    type: object
    required: [job_template]
    additionalProperties: false
    properties:
      job_template: { type: string }
      resources:
        type: object
        additionalProperties: false
        properties:
          gpus: { type: integer }
""")

if __name__ == '__main__':
    main()
