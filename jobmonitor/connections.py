import os

from pymongo import MongoClient
from influxdb import InfluxDBClient


KUBERNETES_NAMESPACE = os.getenv('JOBMONITOR_KUBERNETES_NAMESPACE', default='mlo')


__all__ = ['mongo', 'influx', 'KUBERNETES_NAMESPACE']

mongo_client = MongoClient(
    host=os.getenv('JOBMONITOR_METADATA_HOST'),
    port=int(os.getenv('JOBMONITOR_METADATA_PORT'))
)
mongo = getattr(mongo_client, os.getenv('JOBMONITOR_METADATA_DB'))

influx = InfluxDBClient(
    host=os.getenv('JOBMONITOR_TIMESERIES_HOST'),
    port=int(os.getenv('JOBMONITOR_TIMESERIES_PORT')),
    database=os.getenv('JOBMONITOR_TIMESERIES_DB')
)
