
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
 && rm -rf /var/lib/apt/lists/*

# Set the locale to en_US
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && locale-gen

# Python packages
COPY *.whl install/
RUN pip3 install --upgrade \
    install/*.whl \
    jupyter \
    matplotlib \
    numpy \
    pandas \
    scipy \
    seaborn \
    tensorflow-gpu \
    torchvision

# Install telegraf
COPY telegraf_1.8.3-1_amd64.deb install.deb
RUN dpkg -i install.deb \
 && rm install.deb

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
