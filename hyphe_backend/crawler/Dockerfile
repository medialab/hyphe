FROM python:2.7-alpine

COPY requirements-global-scrapyd.txt /requirements-global-scrapyd.txt

RUN apk --update add gcc musl-dev libffi-dev openssl-dev libxml2-dev libxslt-dev \
        && pip install --no-use-pep517 --no-cache-dir -r requirements-global-scrapyd.txt \
        && pip install --no-cache-dir Scrapy==0.24.6 \
        && pip install --no-cache-dir scrapyd==1.0.1 \
        && apk del gcc musl-dev \
	&& rm /var/cache/apk/*

COPY scrapyd.config /etc/scrapyd/conf.d/100-hyphe

EXPOSE 6800

VOLUME ["/var/lib/scrapyd"]

VOLUME ["/var/log/scrapyd"]

CMD ["scrapyd","--pidfile="]

