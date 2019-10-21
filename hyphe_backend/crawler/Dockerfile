FROM python:2.7-alpine

# Install chromium & chromedriver

RUN echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories \
    && echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories

RUN apk --update add chromium@edge chromium-chromedriver@edge harfbuzz@edge nss@edge

COPY requirements-scrapyd.txt /requirements-scrapyd.txt

RUN apk --update add gcc musl-dev libffi-dev openssl-dev libxml2-dev libxslt-dev \
        && pip install --cache-dir=/tmp/pipcache --upgrade setuptools pip \
        && pip install --cache-dir=/tmp/pipcache --requirement requirements-scrapyd.txt \
        && rm -r /tmp/pipcache \
        && apk del gcc musl-dev \
        && rm /var/cache/apk/*

COPY scrapyd.config /etc/scrapyd/scrapyd.conf

EXPOSE 6800

# Add a common user (required by Chrome)

RUN mkdir -p /app /var/lib/scrapyd /var/log/scrapyd \
    && adduser -D crawler \
    && chown -R crawler:crawler /app \
    && chown -R crawler:crawler /var/lib/scrapyd \
    && chown -R crawler:crawler /var/log/scrapyd

USER crawler

WORKDIR /app

ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/

COPY hcicrawler/spiders/js /app/scrapers_js

CMD ["scrapyd", "--pidfile="]

