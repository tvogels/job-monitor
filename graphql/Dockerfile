FROM node:8-alpine
LABEL maintainer "Thijs Vogels <thijs.vogels@epfl.ch>"

# MongoDB + InfluxDB hostname, ports, db are specified in the pod configuration

ENV DATA=/scratch \
    JOBMONITOR_RESULTS_DIR=/scratch/results

ADD package.json .
RUN npm install

ADD . .

EXPOSE 4000

CMD ["./index.js"]
