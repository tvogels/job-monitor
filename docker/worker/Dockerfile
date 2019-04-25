FROM nvidia/cuda:9.0-cudnn7-devel-ubuntu16.04
LABEL maintainer="Jean-Baptiste Cordonnier <jean-baptiste.cordonnier@epfl.ch>"

# Install some necessary tools.
RUN apt-get update && apt-get install -y \
  build-essential \
  checkinstall \
  cmake \
  curl \
  git \
  htop \
  jq \
  libbz2-dev \
  libc6-dev \
  libffi-dev \
  libgdbm-dev \
  libgoogle-perftools-dev \
  libncursesw5-dev \
  libreadline-gplv2-dev \
  libsqlite3-dev \
  libssl-dev \
  locales \
  openssl \
  pkg-config \
  python3-dev \
  python3-setuptools \
  sudo \
  tk-dev \
  tmux \
  unzip \
  vim \
  wget \
  wget \
  zlib1g-dev \
  zsh \
  && rm -rf /var/lib/apt/lists/*


# Configure environments.
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && locale-gen

# install python3.7
RUN mkdir /opt/python37 && \
  cd /opt/python37 && \
  wget https://www.python.org/ftp/python/3.7.0/Python-3.7.0.tar.xz && \
  tar xvf Python-3.7.0.tar.xz && \
  cd Python-3.7.0 && \
  ./configure && \
  make install

# create python alias
RUN ln -s /usr/local/bin/python3.7 /usr/local/bin/python

RUN python -m pip install --upgrade --no-cache-dir pip

# Python packages
RUN pip3 install --upgrade --no-cache-dir \
  allennlp \
  fastai==1.0 \
  geopandas \
  jupyterlab \
  lmdb \
  matplotlib \
  nbconvert \
  networkx \
  notebook \
  numpy \
  osmnx \
  pandas \
  pygsp \
  pylint \
  pytorch_nlp \
  rope \
  scikit-learn \
  scipy \
  seaborn \
  sentencepiece \
  spacy \
  tabulate \
  termcolor \
  torch \
  torchvision \
  tqdm

# Install Spacy language dependency
RUN python -m spacy download en_core_web_sm

# install sentencepiece
RUN git clone https://github.com/google/sentencepiece.git /opt/sentencepiece && \
  mkdir /opt/sentencepiece/build
WORKDIR /opt/sentencepiece/build
RUN cmake .. && \
  make -j $(nproc) && \
  make install && \
  ldconfig -v

# install senteval
RUN git clone https://github.com/facebookresearch/SentEval.git /opt/senteval && \
  cd /opt/senteval && \
  python setup.py install

# Install telegraf
RUN wget https://dl.influxdata.com/telegraf/releases/telegraf_1.8.3-1_amd64.deb -O telegraf.deb \
  && dpkg -i telegraf.deb \
  && rm telegraf.deb
COPY telegraf.conf /etc/telegraf/telegraf.conf

# Install job-monitor
COPY jobmonitor-0.1-py3-none-any.whl install/
RUN pip install --upgrade install/jobmonitor*.whl

# Required environment variables:
# Telegraf
ENV JOBMONITOR_TELEGRAF_HOST='localhost' \
    JOBMONITOR_TELEGRAF_PORT='8092'
# MongoDB
ENV JOBMONITOR_METADATA_HOST='cordonni-metadata' \
    JOBMONITOR_METADATA_PORT='27017' \
    JOBMONITOR_METADATA_DB='jobmonitor'
# InfluxDB
ENV JOBMONITOR_TIMESERIES_HOST='cordonni-timeseries' \
    JOBMONITOR_TIMESERIES_PORT='8086' \
    JOBMONITOR_TIMESERIES_DB='jobmonitor'

# Configure user and group
ENV SHELL=/bin/zsh
ARG DOCKER_USER
ARG DOCKER_UID
ARG DOCKER_GROUP
ARG DOCKER_GID

ENV HOME=/home/$DOCKER_USER

RUN groupadd $DOCKER_GROUP -g $DOCKER_GID
RUN useradd -m -s /bin/bash -N -u $DOCKER_UID -g $DOCKER_GID $DOCKER_USER && \
  echo "${DOCKER_USER}:${DOCKER_USER}" | chpasswd && \
  usermod -aG sudo,adm,root ${DOCKER_USER}
RUN chown -R ${DOCKER_USER}:${DOCKER_GROUP} ${HOME}

# The user gets passwordless sudo
RUN echo "${DOCKER_USER}   ALL = NOPASSWD: ALL" > /etc/sudoers

COPY entrypoint.sh /entrypoint.sh
RUN chmod 777 /entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]

WORKDIR $HOME

USER ${DOCKER_USER}

# dotfiles
RUN git clone https://github.com/jbcdnr/dotfiles.git && \
  cd dotfiles && \
  ./bootstrap.sh -f && \
  zsh -i -c "echo 'zsh initialization done.'"

