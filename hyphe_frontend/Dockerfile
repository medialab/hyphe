FROM node:lts-alpine AS builder

WORKDIR /hyphe-frontend

ADD . /hyphe-frontend/

RUN apk --update add git \
    && npm ci --production false 

FROM nginx:alpine

ENV BACKEND_PORT=6978
ENV BACKEND_HOST=backend

COPY --from=builder --chown=nginx:nginx /hyphe-frontend/app /frontend/app

WORKDIR /frontend/app

COPY ./docker-nginx-vhost.conf /etc/nginx/conf.d/docker-nginx-vhost.template

COPY docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
