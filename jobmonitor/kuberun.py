#!/usr/bin/env python3

import os
import numpy as np
from argparse import ArgumentParser

from kubernetes import client, config, watch

from jobmonitor.api import kubernetes_create_base_pod_spec
from jobmonitor.connections import KUBERNETES_NAMESPACE


"""
Launch any command in a Kubernetes pod
"""


def main():
    parser = ArgumentParser()
    parser.add_argument("-g", "--gpus", type=int, default=0)
    parser.add_argument("-d", "--docker-image", default=os.getenv("JOBMONITOR_DOCKER_IMAGE"))
    parser.add_argument("-n", "--pod-name", default=None, help="default: user name and random id")
    parser.add_argument("-m", "--memory-limit", default=128)
    parser.add_argument("-c", "--cpu-limit", default=20)
    parser.add_argument("-l", "--labels", default=[], nargs="+", help="format: key=label")
    parser.add_argument("-u", "--user", default=os.getenv("USER"))
    parser.add_argument("-v", "--volumes", nargs="+", default=["pv-mlodata1"])
    parser.add_argument("command", nargs="+")
    args = parser.parse_args()

    # Configs can be set in Configuration class directly or using helper utility
    config.load_kube_config()
    v1 = client.CoreV1Api()

    if args.docker_image is None:
        raise ValueError(
            "No docker image specified. Default can be set in environment variable `JOBMONITOR_DOCKER_IMAGE`."
        )

    pod_spec = kubernetes_create_base_pod_spec(
        cmd=args.command,
        docker_image_path=args.docker_image,
        gpus=args.gpus,
        mem=args.memory_limit,
        cpu=args.cpu_limit,
        environment_variables={
            "DATA": f"/pv-mlodata1/{args.user}",
            "JOBMONITOR_RESULTS_DIR": f"/pv-mlodata1/{args.user}/results",
        },
        volumes={v: v for v in args.volumes},
    )

    labels = dict(label_string.split("=") for label_string in args.labels)

    if args.pod_name:
        pod_name = args.pod_name
    else:
        random = np.random.randint(low=1_000_000_000, high=9_999_999_999)
        pod_name = f"{args.user}-{random}"

    labels = dict(app="jobmonitor", user=args.user, **labels)
    if args.gpus == 0:
        labels["hardware-type"] = "CPUONLY"

    pod = client.V1Pod(metadata=client.V1ObjectMeta(name=pod_name, labels=labels), spec=pod_spec)

    out = v1.create_namespaced_pod(KUBERNETES_NAMESPACE, pod)

    print("Created pod %s" % out.metadata.name)


if __name__ == "__main__":
    main()
