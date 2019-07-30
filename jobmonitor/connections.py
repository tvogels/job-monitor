import os

from gridfs import GridFS
from influxdb import InfluxDBClient
from pymongo import MongoClient

KUBERNETES_NAMESPACE = os.getenv("JOBMONITOR_KUBERNETES_NAMESPACE", default="mlo")


__all__ = ["mongo", "influx", "gridfs", "KUBERNETES_NAMESPACE"]

mongo_client = MongoClient(
    host=os.getenv("JOBMONITOR_METADATA_HOST"),
    port=int(os.getenv("JOBMONITOR_METADATA_PORT")),
    username=os.getenv("JOBMONITOR_METADATA_USER"),
    password=os.getenv("JOBMONITOR_METADATA_PASS"),
)
mongo = getattr(mongo_client, os.getenv("JOBMONITOR_METADATA_DB"))

gridfs = GridFS(mongo)

influx = InfluxDBClient(
    host=os.getenv("JOBMONITOR_TIMESERIES_HOST"),
    port=int(os.getenv("JOBMONITOR_TIMESERIES_PORT")),
    database=os.getenv("JOBMONITOR_TIMESERIES_DB"),
    username=os.getenv("JOBMONITOR_METADATA_USER"),
    password=os.getenv("JOBMONITOR_METADATA_PASS"),
)
