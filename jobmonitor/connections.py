import os


KUBERNETES_NAMESPACE = os.getenv("JOBMONITOR_KUBERNETES_NAMESPACE", default="mlo")


__all__ = ["mongo", "influx", "gridfs", "KUBERNETES_NAMESPACE"]


_influx_client = None
_mongo_client = None
_gridfs_client = None


def __getattr__(name):
    global _influx_client
    global _mongo_client
    global _gridfs_client

    if name == "influx":
        if _influx_client is None:
            from influxdb import InfluxDBClient

            _influx_client = InfluxDBClient(
                host=os.getenv("JOBMONITOR_TIMESERIES_HOST"),
                port=int(os.getenv("JOBMONITOR_TIMESERIES_PORT")),
                database=os.getenv("JOBMONITOR_TIMESERIES_DB"),
                username=os.getenv("JOBMONITOR_METADATA_USER"),
                password=os.getenv("JOBMONITOR_METADATA_PASS"),
            )
        return _influx_client

    elif name == "mongo" or name == "gridfs":
        if _mongo_client is None:
            from gridfs import GridFS
            from pymongo import MongoClient

            if os.getenv("JOBMONITOR_METADATA_USER") is not None:
                mongo_client = MongoClient(
                    host=os.getenv("JOBMONITOR_METADATA_HOST"),
                    port=int(os.getenv("JOBMONITOR_METADATA_PORT")),
                    username=os.getenv("JOBMONITOR_METADATA_USER"),
                    password=os.getenv("JOBMONITOR_METADATA_PASS"),
                )
            else:
                mongo_client = MongoClient(
                    host=os.getenv("JOBMONITOR_METADATA_HOST"),
                    port=int(os.getenv("JOBMONITOR_METADATA_PORT")),
                )
            _mongo_client = getattr(mongo_client, os.getenv("JOBMONITOR_METADATA_DB"))
            _gridfs_client = GridFS(_mongo_client)

        if name == "mongo":
            return _mongo_client
        elif name == "gridfs":
            return _gridfs_client

