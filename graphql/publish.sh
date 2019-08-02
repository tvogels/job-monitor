#!/bin/bash

# This is just because I am lazy.
# The real publish script is user-specific and thus
# Located in /kubernetes.

pushd ../kubernetes/graphql/
./publish.sh
popd
