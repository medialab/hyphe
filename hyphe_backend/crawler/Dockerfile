FROM python:2.7-alpine

COPY requirements-scrapyd.txt /requirements-scrapyd.txt

RUN apk --update add gcc musl-dev libffi-dev openssl-dev libxml2-dev libxslt-dev \
        && pip install --cache-dir=/tmp/pipcache --upgrade setuptools pip \
        && pip install --cache-dir=/tmp/pipcache --requirement requirements-scrapyd.txt \
        && rm -r /tmp/pipcache \
        && apk del gcc musl-dev \
        && rm /var/cache/apk/*

COPY scrapyd.config /etc/scrapyd/scrapyd.conf

EXPOSE 6800

VOLUME ["/var/lib/scrapyd"]

VOLUME ["/var/log/scrapyd"]

CMD ["scrapyd","--pidfile="]

