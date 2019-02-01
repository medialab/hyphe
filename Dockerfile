FROM python:2.7-alpine

WORKDIR /app

ENV PYTHONPATH $PYTHONPATH:/app

COPY requirements.txt /app/requirements.txt

RUN apk --update add gcc git musl-dev libxml2-dev libxslt-dev libffi-dev openssl-dev \
        && pip install --cache-dir=/tmp/pipcache --upgrade setuptools pip \
        && pip install --cache-dir=/tmp/pipcache --requirement /app/requirements.txt \
        && pip install --cache-dir=/tmp/pipcache Scrapy==0.24.6 \
        && rm -r /tmp/pipcache \
        && apk del gcc git musl-dev \
        && rm /var/cache/apk/*

RUN adduser -D -u 1000 hyphe

COPY ./bin /app/bin

COPY ./config /app/config.sample

COPY ./hyphe_backend /app/hyphe_backend

COPY ./docker-entrypoint.py /app/docker-entrypoint.py

RUN mkdir /app/config
RUN mkdir /app/traph-data

RUN chmod +x /app/docker-entrypoint.py

RUN chmod +x /app/hyphe_backend/core.tac

EXPOSE 6978

RUN chown -R hyphe:hyphe /app

VOLUME ["/app/traph-data"]

RUN ls -la /app/*

USER hyphe

ENTRYPOINT ["/app/docker-entrypoint.py"]
