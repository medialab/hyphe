FROM python:2.7

WORKDIR /app

# Install system dependencies

RUN apt-get update && apt-get install openjdk-7-jdk -y --no-install-recommends


# App python dependencies

COPY requirements.txt /app/requirements.txt

ENV WORKON_HOME /opt/virtualenvs

RUN mkdir -p ${WORKON_HOME} \
  && pip install virtualenv \
  && pip install virtualenvwrapper \
  && /bin/bash -c "source $(which virtualenvwrapper.sh) \
  && mkvirtualenv --no-site-packages hyphe \
  && workon hyphe \
  && add2virtualenv $(pwd) \
  && pip install -r /app/requirements.txt" \
  && pip install Scrapy \
  && echo 'source $(which virtualenvwrapper.sh) && workon hyphe' | tee /root/.bashrc


# Install app

COPY ./bin /app/bin
COPY ./config /app/config
COPY ./hyphe_backend /app/hyphe_backend

RUN sed "s|##HYPHEPATH##|"`pwd`"|" /app/config/config.json.example > /app/config/config.json \
  && mkdir -p /app/hyphe_backend/crawler/config \
  && cp /app/config/config.json /app/hyphe_backend/crawler/config/config.json


# Start hyphe

EXPOSE 6978

CMD /bin/bash -c "source $(which virtualenvwrapper.sh) && workon hyphe && twistd -y /app/hyphe_backend/core.tac --nodaemon"
