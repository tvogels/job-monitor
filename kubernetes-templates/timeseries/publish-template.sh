#!/bin/bash

kubectl delete -f . --ignore-note-found
&& kubectl create -f .
