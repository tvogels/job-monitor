#!/bin/bash

VERSION=1.1

docker build ../../graphql -t {{user.name}}_graphql \
&& docker tag {{user.name}}_graphql ic-registry.epfl.ch/mlo/{{user.name}}_graphql \
&& docker tag {{user.name}}_graphql tvogels/mlo-graphql:$VERSION \
&& docker push ic-registry.epfl.ch/mlo/{{user.name}}_graphql \
&& docker push tvogels/mlo-graphql:$VERSION \
&& kubectl apply -f .
