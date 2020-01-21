#!/bin/bash

VERSION=1.7

docker build . -t graphql \
&& docker tag graphql ic-registry.epfl.ch/mlo/vogels_graphql:$VERSION \
&& docker tag graphql tvogels/mlo-graphql:$VERSION \
&& docker push ic-registry.epfl.ch/mlo/vogels_graphql:$VERSION \
&& docker push tvogels/mlo-graphql:$VERSION \
&& docker tag graphql eu.gcr.io/rank1-gradient-compression/graphql:$VERSION \
&& docker push eu.gcr.io/rank1-gradient-compression/graphql:$VERSION
