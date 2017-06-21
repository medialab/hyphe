FROM buildpack-deps:wheezy

ENV LANG C.UTF-8

RUN apt-get update \
  && apt-get install python2.7-dev python-pip python-support --no-install-recommends -y \
  && wget -q -P ./ https://github.com/medialab/scrapyd/raw/medialab-debian/debs/scrapyd_1.0~r0_all.deb \
  && pip install service_identity \
  && pip install pymongo==2.7 \
  && pip install txmongo==0.6 \
  && pip install selenium==2.42.1 \
  && pip install Scrapy==0.24.6 \
  && dpkg -i scrapyd_1.0~r0_all.deb

EXPOSE 6800

VOLUME ["/var/lib/scrapyd"]
VOLUME ["/var/log/scrapyd"]

# Set scrapyd as run entrypoint
CMD ["/usr/bin/scrapyd"]
