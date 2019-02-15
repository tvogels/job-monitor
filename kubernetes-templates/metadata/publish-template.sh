#!/bin/bash

kubectl create -f .

docker build . -t {{user.name}}_graphql \
&& docker tag {{user.name}}_graphql ic-registry.epfl.ch/mlo/{{user.name}}_graphql \
&& docker push ic-registry.epfl.ch/mlo/{{user.name}}_graphql \
&& kubectl delete -f . --ignore-not-found \
&& kubectl create -f .
