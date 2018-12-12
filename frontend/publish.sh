#!/bin/bash

yarn build

docker build . -t vogels_frontend
docker tag vogels_frontend ic-registry.epfl.ch/mlo/vogels_frontend
docker push ic-registry.epfl.ch/mlo/vogels_frontend

kubectl delete -f ./kubernetes
kubectl create -f ./kubernetes