FROM python:2.7-alpine

COPY requirements-global-scrapyd.txt /requirements-global-scrapyd.txt

RUN apk --update add gcc musl-dev libffi-dev openssl-dev libxml2-dev libxslt-dev \
        && pip install --cache-dir=/tmp/pipcache --upgrade setuptools pip \
        && pip install --cache-dir=/tmp/pipcache -r requirements-global-scrapyd.txt \
        && pip install --cache-dir=/tmp/pipcache Scrapy==0.24.6 \
        && pip install --cache-dir=/tmp/pipcache scrapyd==1.0.1 \
        && rm -r /tmp/pipcache \
        && apk del gcc musl-dev \
        && rm /var/cache/apk/*

COPY scrapyd.config /etc/scrapyd/conf.d/100-hyphe

EXPOSE 6800

CMD ["scrapyd","--pidfile="]

