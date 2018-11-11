
FROM nvidia/cuda:9.0-cudnn7-devel-ubuntu16.04
LABEL maintainer "Thijs Vogels <thijs.vogels@epfl.ch>"

# Required environment variables:
# Telegraf
ENV JOBMONITOR_TELEGRAF_HOST='localhost' \
    JOBMONITOR_TELEGRAF_PORT='8092'
# MongoDB
ENV JOBMONITOR_METADATA_HOST='' \
    JOBMONITOR_METADATA_PORT='27017' \
    JOBMONITOR_METADATA_DB='jobmonitor'

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

# Jupyter and TensorFlow
EXPOSE 8888 6006
