import datetime
import os

import kubernetes
from bson.objectid import ObjectId
from kubernetes.client import (V1Container, V1EnvVar, V1Job, V1JobSpec,
                               V1ObjectMeta,
                               V1PersistentVolumeClaimVolumeSource, V1PodSpec,
                               V1PodTemplateSpec, V1ResourceRequirements,
                               V1Volume, V1VolumeMount)
from schema import Or, Schema

from jobmonitor.connections import KUBERNETES_NAMESPACE, mongo


def job_by_id(job_id):
    return mongo.job.find_one({ '_id': ObjectId(job_id) })


def delete_job_by_id(job_id):
    return mongo.job.delete_one({ '_id': ObjectId(job_id) })


def update_job(job_id, update_dict):
    return mongo.job.update({ '_id': ObjectId(job_id) }, { '$set': update_dict })


def register_job(project, experiment, job, config_overrides, runtime_environment, annotations=None, user=None):
    if user is None:
        user = os.getenv('USER')

    # Validate the inputs
    Schema(str).validate(user)
    Schema(str).validate(project)
    Schema(str).validate(experiment)
    Schema(str).validate(job)
    Schema({str: object}).validate(config_overrides)
    Schema(Or(None, {str: object})).validate(annotations)
    Schema({'clone': {'path': str}, 'script': str}).validate(runtime_environment)

    # Format the database entry
    job_content = {
        'user': user,
        'project': project,
        'experiment': experiment,
        'job': job,
        'config': config_overrides,
        'environment': runtime_environment,
        'status': 'CREATED',
        'creation_time': datetime.datetime.utcnow(),
    }
    if annotations is not None:
        job_content['annotations'] = annotations

    insert_result = mongo.job.insert_one(job_content)
    job_id = str(insert_result.inserted_id)
    return job_id


def kubernetes_delete_job(kubernetes_job_name):
    kubernetes.config.load_kube_config()
    client = kubernetes.client.BatchV1Api()
    body = kubernetes.client.V1DeleteOptions()
    return client.delete_namespaced_job(kubernetes_job_name, namespace=KUBERNETES_NAMESPACE, body=body)


def kubernetes_schedule_job(job_id, docker_image_path, scratch_volume, scratch_sub_path, gpus=None, results_dir='/scratch/results'):
    """
    Example inputs:
    docker_iamge_path: ic-registry.epfl.ch/mlo/jobmonitor_worker
    scratch_volume: pv-mlodata1
    scratch_sub_path: vogels
    """
    job = job_by_id(job_id)
    kubernetes.config.load_kube_config()
    client = kubernetes.client.BatchV1Api()
    job_name = '{}-{}'.format(job['user'], job_id[-6:])
    metadata = V1ObjectMeta(
        name=job_name,
        labels=dict(
            app='jobmonitor',
            user=job['user'],
            project=job['project'],
            experiment=job['experiment'],
            job=job['job'],
            job_id=job_id,
        ),
    )
    job = V1Job(
        metadata=metadata,
        spec=V1JobSpec(
            template=V1PodTemplateSpec(
                metadata=metadata,
                spec=V1PodSpec(
                    restart_policy='Never',
                    volumes=[
                        V1Volume(
                            name=scratch_volume,
                            persistent_volume_claim=V1PersistentVolumeClaimVolumeSource(claim_name=scratch_volume),
                        ),
                    ],
                    containers=[
                        V1Container(
                            name='worker',
                            image=docker_image_path,
                            env=[
                                V1EnvVar(name='DATA', value='/scratch'),
                                V1EnvVar(name='JOBMONITOR_RESULTS_DIR', value=results_dir),
                            ],
                            volume_mounts=[
                                V1VolumeMount(mount_path='/scratch', name=scratch_volume, sub_path=scratch_sub_path)
                            ],
                            resources=(
                                V1ResourceRequirements(limits={'nvidia.com/gpu': gpus}) if gpus else None
                            ),
                            command=['/entrypoint.sh', 'jobrun', job_id],
                        )
                    ]
                )
            ),
        )
    )
    client.create_namespaced_job(KUBERNETES_NAMESPACE, job)
    update_job(job_id, { 'status': 'SCHEDULED', 'schedule_time': datetime.datetime.utcnow() })


def result_dir(job):
    root_dir = os.getenv('JOBMONITOR_RESULTS_DIR')
    if type(job) == str:
        job = job_by_id(job)
    return os.path.join(root_dir, job['output_dir'])
