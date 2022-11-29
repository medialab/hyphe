FROM python:2.7-slim

COPY requirements-scrapyd.txt /requirements-scrapyd.txt

RUN buildDeps='gcc libffi-dev libxml2-dev libxslt-dev' \
    && apt-get update && apt-get install -y $buildDeps \
    && pip install --cache-dir=/tmp/pipcache --upgrade setuptools pip \
    && cat requirements-scrapyd.txt | xargs -n 1 -L 1 pip install --cache-dir=/tmp/pipcache
    && rm -r /tmp/pipcache \
    && apt-get purge -y --auto-remove $buildDeps \
    && rm -rf /var/lib/apt/lists/*

COPY scrapyd.config /etc/scrapyd/scrapyd.conf

EXPOSE 6800

VOLUME ["/var/lib/scrapyd"]

VOLUME ["/var/log/scrapyd"]

CMD ["scrapyd","--pidfile="]

