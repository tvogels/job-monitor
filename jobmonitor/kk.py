#!/usr/bin/env python3

import argparse
import configparser
import json
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime
from shutil import copyfile

import yaml
from kubernetes import client, config
from kubernetes.stream import stream
from termcolor import colored


class Config:
    namespace = "mlo"
    user = "cordonni"
    worker_kubernetes_file = "kubernetes.yaml"
    default_kubernetes_file = "ressources/kubernetes_default.yaml"
    metadata_pod = "cordonni-metadata"


api = None


def get_kubernetes_client():
    global api
    if api is None:
        config.load_kube_config()
        api = client.CoreV1Api()
    return api


def wait_for_pod_phase(pod: str, phase_check: callable) -> str:
    time.sleep(1)
    while True:
        resp = api.read_namespaced_pod(name=pod, namespace=Config.namespace)
        phase = resp.status.phase
        if phase_check(phase):
            return phase
        time.sleep(1)


def print_future_commands(job_id, pod_name, user):
    commands = {
        "Check pod status": f"kubectl get pod {pod_name}",
        "Check logs of your job": f"kubectl logs {pod_name}",
        "Run a shell in the pod": f"kubectl exec -it {pod_name} zsh",
    }
    s = "\n".join([f"{description}:\n\t{command}" for description, command in commands.items()])
    print(colored("Commands:", "green"))
    print(s)


def copy_default_kubernetes():
    if os.path.exists(Config.worker_kubernetes_file):
        print(f"'{Config.worker_kubernetes_file}' already exists.")
        exit(1)

    default_file = os.path.join(os.path.dirname(__file__), Config.default_kubernetes_file)
    copyfile(default_file, Config.worker_kubernetes_file)
    print(f"Created default '{Config.worker_kubernetes_file}' file.")


def main():
    config_file = os.path.join(os.path.dirname(__file__), "config")
    conf = configparser.ConfigParser()
    conf.read(config_file)
    worker_kubernetes_file = Config.worker_kubernetes_file

    parser = argparse.ArgumentParser(description="Kubernetes worker.")
    parser.add_argument("command", type=str, nargs="*", help="command to run.")

    args = parser.parse_args()
    command = args.command
    timestamp = datetime.now().strftime("%Y-%m-%d-%H:%M:%S")
    job_id = uuid.uuid4().hex[:8]  # generate unique `job_id`
    print(colored(f"Job id is {job_id}", "blue"))

    if len(command) == 0:
        print("Error: no command given.")
        parser.print_help()
        exit(1)

    # check config exists
    if not os.path.exists(worker_kubernetes_file):
        print(f"Please run this in a directory containing '{worker_kubernetes_file}''")

    with open(worker_kubernetes_file, "r") as f:
        deployment = yaml.safe_load(f)
    print(f"Loaded worker pod configutation from '{worker_kubernetes_file}'.")

    # worker pod configuration
    runs_directory = f"/mlodata1/{Config.user}/runs"
    job_directory = os.path.join(runs_directory, job_id)

    # update pod deployment name
    assert len(deployment["spec"]["containers"]) == 1, "Only support one pod worker."
    deployment["metadata"]["name"] += f"-{job_id}"
    deployment["spec"]["containers"][0]["name"] += f"-{job_id}"

    # add environment variables JOBMONITOR_ID and JOBMONITOR_DIRECTORY
    env = deployment["spec"]["containers"][0].get("env", [])
    env.append({"name": "JOBMONITOR_ID", "value": job_id})
    env.append({"name": "JOBMONITOR_DIRECTORY", "value": os.path.join(job_directory, "code")})
    deployment["spec"]["containers"][0]["env"] = env

    # add command to run from CLI
    exec_command = ["/entrypoint.sh", f"cd {job_directory}/code && " + " ".join(command)]
    deployment["spec"]["containers"][0]["command"] = exec_command

    worker_pod_name = deployment["metadata"]["name"]

    print(f"Creating directory structure and copying code...", end=" ")
    sys.stdout.flush()

    # create directory structure
    subprocess.run(
        [
            "kubectl",
            "exec",
            "-it",
            Config.metadata_pod,
            "--",
            "mkdir",
            "-p",
            f"{job_directory}/output",
        ]
    )

    # copy current directory
    subprocess.run(
        ["kubectl", "cp", ".", f"{Config.namespace}/{Config.metadata_pod}:{job_directory}/code"]
    )
    print("Done.")

    # deploy the pods and wait until created
    print(f"Creating '{worker_pod_name}' pod...", end=" ")
    sys.stdout.flush()
    get_kubernetes_client().create_namespaced_pod(Config.namespace, deployment)
    phase = wait_for_pod_phase(
        worker_pod_name, lambda p: p in ["Running", "Completed", "Succeeded", "Error", "Failed"]
    )
    if phase not in ["Running", "Completed", "Succeeded"]:
        print()
        print(colored(f"Pod creation failed with status: {phase}", "red"))
    else:
        print(phase)
        print_future_commands(job_id, worker_pod_name, Config.user)


if __name__ == "__main__":
    main()
