#!/bin/bash

# This file contains user-specific stuff and is generated automatically from the template
# kubernetes-templates/frontend/publish-template.sh

docker build ../../frontend -t {{user.name}}_frontend \
  --build-arg GRAPHQL_HOST={{user.name}}-graphql.mlo.k8s.iccluster.epfl.ch \
  --build-arg GRAPHQL_PORT={{ports.graphql}} \
&& docker tag {{user.name}}_frontend ic-registry.epfl.ch/mlo/{{user.name}}_frontend \
&& docker push ic-registry.epfl.ch/mlo/{{user.name}}_frontend \
&& kubectl delete -f . --ignore-not-found \
&& sleep 5 \
&& kubectl create -f .
