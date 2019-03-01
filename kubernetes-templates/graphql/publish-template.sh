#!/bin/bash

docker build ../../graphql -t {{user.name}}_graphql \
&& docker tag {{user.name}}_graphql ic-registry.epfl.ch/mlo/{{user.name}}_graphql \
&& docker push ic-registry.epfl.ch/mlo/{{user.name}}_graphql \
&& kubectl delete -f . --ignore-not-found \
&& sleep 5 \
&& kubectl create -f .
