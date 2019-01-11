# This is an example of a dockerfile that can be used with the job monitor

FROM nvidia/cuda:9.0-cudnn7-devel-ubuntu16.04
LABEL maintainer "Thijs Vogels <thijs.vogels@epfl.ch>"

# Install lots of apt packages
RUN apt-get update && apt-get install -y \
    cmake \
    curl \
    git \
    htop \
    locales \
    python3 \
    python3-pip \
    sudo \
    tmux \
    unzip \
    vim \
    wget \
    zsh \
    libssl-dev \
    libffi-dev \
 && rm -rf /var/lib/apt/lists/*

# Set the locale to en_US
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && locale-gen

# Python packages
RUN pip3 install --upgrade \
    jupyter \
    matplotlib \
    numpy \
    pandas \
    scipy \
    seaborn \
    tensorflow-gpu

# Install telegraf
RUN wget https://dl.influxdata.com/telegraf/releases/telegraf_1.8.3-1_amd64.deb -O telegraf.deb \
 && dpkg -i telegraf.deb \
 && rm telegraf.deb
COPY telegraf.conf /etc/telegraf/telegraf.conf

# Install torch
COPY torch-0.4.1-cp35-cp35m-manylinux1_x86_64.whl install/
RUN pip3 install --upgrade install/torch*.whl torchvision

# Install the job monitor python library
COPY jobmonitor-0.1-py3-none-any.whl install/
RUN pip3 install --upgrade install/jobmonitor*.whl

# Required environment variables:
# Telegraf
ENV JOBMONITOR_TELEGRAF_HOST='localhost' \
    JOBMONITOR_TELEGRAF_PORT='8092'
# MongoDB
ENV JOBMONITOR_METADATA_HOST='' \
    JOBMONITOR_METADATA_PORT='27017' \
    JOBMONITOR_METADATA_DB='jobmonitor'
# InfluxDB
ENV JOBMONITOR_TIMESERIES_HOST='' \
    JOBMONITOR_TIMESERIES_PORT='8086' \
    JOBMONITOR_TIMESERIES_DB='jobmonitor'

# Add an entrypoint script that will start the telegraf service
COPY entrypoint.sh /entrypoint.sh
RUN chmod 777 /entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]

# Jupyter and TensorFlow
EXPOSE 8888 6006
