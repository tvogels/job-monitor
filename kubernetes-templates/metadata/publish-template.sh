#!/bin/bash

kubectl delete -f . --ignore-not-found \
&& kubectl create -f .