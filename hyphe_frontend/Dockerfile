FROM nginx:alpine

COPY . /frontend/

WORKDIR /frontend

RUN apk --update add git nodejs \
    && npm install \
    && npm run build \
    && npm cache clean \
    && apk del git nodejs \
    && rm -fr node_modules \
    && rm /var/cache/apk/*

COPY ./docker-nginx-vhost.conf /etc/nginx/conf.d/default.conf

COPY docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
