#!/bin/bash

kubectl delete -f . --ignore-not-found \
&& sleep 5 \
&& kubectl create -f .
