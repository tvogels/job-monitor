#!/bin/bash

set -e

if [ "$#" -ne 1 ]; then
    echo "usage: $0 version"
    exit 1
fi

version=$1

# Build the Python code into a package
rm -f jobmonitor*.whl
pushd ../..
python3 setup.py sdist bdist_wheel
cp dist/jobmonitor*.whl docker/worker
popd

# build local image
docker build . -t ic-registry.epfl.ch/mlo/cordonni-worker-local:$version \
  --build-arg DOCKER_USER=jb \
  --build-arg DOCKER_UID=501 \
  --build-arg DOCKER_GROUP=admin \
  --build-arg DOCKER_GID=80

# build image for kubernetes
docker build . -t ic-registry.epfl.ch/mlo/cordonni-worker:$version \
  --build-arg DOCKER_USER=cordonni \
  --build-arg DOCKER_UID=125633 \
  --build-arg DOCKER_GROUP=mlo \
  --build-arg DOCKER_GID=11169

# push kubernetes image
docker push ic-registry.epfl.ch/mlo/cordonni-worker:$version

echo "Create docker image: ic-registry.epfl.ch/mlo/cordonni-worker-local:$version"
echo "Create docker image: ic-registry.epfl.ch/mlo/cordonni-worker:$version"
echo "Pushed docker image: ic-registry.epfl.ch/mlo/cordonni-worker:$version"
