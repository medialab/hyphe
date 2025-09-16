FROM python:2.7-slim

WORKDIR /app

COPY requirements.txt /app/requirements.txt

RUN buildDeps='gcc libffi-dev libxml2-dev libxslt-dev' \
    && sed -i 's#http://\(security\|deb\)\.debian#http://archive.debian#' /etc/apt/sources.list \
    && apt-get update && apt-get install -y $buildDeps \
    && pip install --cache-dir=/tmp/pipcache --upgrade setuptools pip \
    && cat /app/requirements.txt | xargs -n 1 -L 1 pip install --cache-dir=/tmp/pipcache \
    && rm -r /tmp/pipcache \
    && apt-get purge -y --auto-remove $buildDeps \
    && rm -rf /var/lib/apt/lists/* 

COPY ./bin /app/bin

COPY ./config /app/config.sample

COPY ./hyphe_backend /app/hyphe_backend

COPY ./docker-entrypoint.py /app/docker-entrypoint.py

RUN mkdir /app/config

RUN chmod +x /app/docker-entrypoint.py

RUN chmod +x /app/hyphe_backend/core.tac

EXPOSE 6978

VOLUME ["/app/config"]

VOLUME ["/app/traph-data"]

ENTRYPOINT ["/app/docker-entrypoint.py"]
