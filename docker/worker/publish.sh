#!/bin/bash

# Build the Python code into a package
rm jobmonitor*.whl
pushd ../..
python3 setup.py sdist bdist_wheel
cp dist/jobmonitor*.whl docker/worker
popd

# Download the torch executable
TORCH=torch-0.4.1-cp35-cp35m-manylinux1_x86_64.whl
if [ ! -f $TORCH ]; then
    wget https://files.pythonhosted.org/packages/f9/4e/1bcb4688b7506c340ca6ba5b9f57f4ad3b59a193bba365bf2b51e9e4bb3e/$TORCH
fi

# Build docker
docker build . -t jobmonitor_worker
docker tag jobmonitor_worker ic-registry.epfl.ch/mlo/jobmonitor_worker
docker push ic-registry.epfl.ch/mlo/jobmonitor_worker
