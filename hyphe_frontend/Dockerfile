FROM nginx:alpine

ENV BACKEND_PORT=6978
ENV BACKEND_HOST=backend

COPY . /frontend/

WORKDIR /frontend

RUN apk --update add git nodejs nodejs-npm \
    && npm ci \
    && npm run build \
    && npm cache clean --force \
    && apk del git nodejs \
    && rm -fr node_modules \
    && rm /var/cache/apk/*

COPY ./docker-nginx-vhost.conf /etc/nginx/conf.d/docker-nginx-vhost.template

COPY docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
