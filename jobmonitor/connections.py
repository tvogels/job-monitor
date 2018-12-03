import os

from pymongo import MongoClient
from influxdb import InfluxDBClient

__all__ = ['mongo', 'influx']

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
