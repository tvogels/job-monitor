#!/bin/bash

yarn build

docker build ../../frontend -t {{user.name}}_frontend \
&& docker tag {{user.name}}_frontend ic-registry.epfl.ch/mlo/{{user.name}}_frontend \
&& docker push ic-registry.epfl.ch/mlo/{{user.name}}_frontend \
&& kubectl delete -f . --ignore-not-found \
&& kubectl create -f .