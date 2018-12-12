FROM node
LABEL maintainer "Thijs Vogels <thijs.vogels@epfl.ch>"

# MongoDB
ENV JOBMONITOR_METADATA_HOST='vogels-metadata' \
    JOBMONITOR_METADATA_PORT='27017' \
    JOBMONITOR_METADATA_DB='jobmonitor'

# InfluxDB
ENV JOBMONITOR_TIMESERIES_HOST='vogels-timeseries' \
    JOBMONITOR_TIMESERIES_PORT='8086' \
    JOBMONITOR_TIMESERIES_DB='jobmonitor'

ADD . .

EXPOSE 4000

CMD ["./index.js"]
