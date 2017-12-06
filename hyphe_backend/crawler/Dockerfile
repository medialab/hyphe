FROM python:2.7-alpine

COPY ./hyphe_backend/crawler/requirements-global-scrapyd.txt /requirements-global-scrapyd.txt

RUN apk --update add gcc musl-dev libffi-dev openssl-dev libxml2-dev libxslt-dev \
        && pip install --no-cache-dir -r requirements-global-scrapyd.txt \
        && pip --no-cache-dir install Scrapy==0.24.6 \
        && pip --no-cache-dir install scrapyd==1.0.1 \
        && apk del gcc musl-dev \
	&& rm /var/cache/apk/*

COPY ./config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe

EXPOSE 6800

VOLUME ["/var/lib/scrapyd"]

VOLUME ["/var/log/scrapyd"]

CMD ["scrapyd"]

