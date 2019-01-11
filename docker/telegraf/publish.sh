#!/bin/bash

# Download telegraf install
TELEGRAF=telegraf_1.8.3-1_amd64.deb
if [ ! -f $TELEGRAF ]; then
    wget https://dl.influxdata.com/telegraf/releases/$TELEGRAF
fi

docker build . -t jobmonitor_telegraf \
&& docker tag jobmonitor_telegraf ic-registry.epfl.ch/mlo/jobmonitor_telegraf \
&& docker push ic-registry.epfl.ch/mlo/jobmonitor_telegraf
