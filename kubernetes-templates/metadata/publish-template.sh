#!/bin/bash

kubectl delete -f . --ignore-not-found --wait=true \
&& kubectl create -f .
