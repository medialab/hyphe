FROM python:3.5

ADD ./docker-entrypoint.sh /docker-entrypoint.sh
RUN ["chmod", "+x", "/docker-entrypoint.sh"]

ENTRYPOINT ["/bin/bash", "/docker-entrypoint.sh", "$MODE"]