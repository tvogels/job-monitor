#!/bin/bash

VERSION=1.3

# This file contains user-specific stuff and is generated automatically from the template
docker build . -t frontend \
  --build-arg GRAPHQL_HOST=graphql-sjvtnngdaq-ew.a.run.app \
  --build-arg GRAPHQL_PORT=443 \
&& docker tag frontend ic-registry.epfl.ch/mlo/vogels_frontend:$VERSION \
&& docker push ic-registry.epfl.ch/mlo/vogels_frontend:$VERSION \
&& docker tag frontend ic-registry.epfl.ch/mlo/vogels_frontend:latest \
&& docker push ic-registry.epfl.ch/mlo/vogels_frontend:latest
