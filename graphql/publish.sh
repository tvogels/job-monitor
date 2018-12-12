#!/bin/bash

docker build . -t vogels_graphql
docker tag vogels_graphql ic-registry.epfl.ch/mlo/vogels_graphql
docker push ic-registry.epfl.ch/mlo/vogels_graphql
kubectl delete -f ./kubernetes
kubectl create -f ./kubernetes