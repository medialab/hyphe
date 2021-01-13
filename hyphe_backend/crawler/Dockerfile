FROM python:2.7-slim

COPY requirements-scrapyd.txt /requirements-scrapyd.txt

RUN buildDeps='gcc libffi-dev libxml2-dev libxslt-dev' \
    && apt-get update && apt-get install -y $buildDeps \
    && pip install --cache-dir=/tmp/pipcache --upgrade setuptools pip \
    && pip install --cache-dir=/tmp/pipcache --requirement requirements-scrapyd.txt \
    && rm -r /tmp/pipcache \
    && apt-get purge -y --auto-remove $buildDeps \
    && rm -rf /var/lib/apt/lists/*

COPY scrapyd.config /etc/scrapyd/scrapyd.conf

EXPOSE 6800

VOLUME ["/var/lib/scrapyd"]

VOLUME ["/var/log/scrapyd"]

CMD ["scrapyd","--pidfile="]

