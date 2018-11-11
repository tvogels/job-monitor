#!/bin/bash
sudo service telegraf start
exec "$@"
