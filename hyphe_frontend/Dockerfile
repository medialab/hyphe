FROM nginx:alpine

ENV BACKEND_PORT=6978
ENV BACKEND_HOST=backend

COPY . /frontend/

WORKDIR /frontend

RUN apk --update add git nodejs nodejs-npm \
    && npm install \
    && npm run build \
    && npm cache clean --force \
    && apk del git nodejs \
    && rm -fr node_modules \
    && rm /var/cache/apk/*

RUN sed -i '/user  nginx;/d' /etc/nginx/nginx.conf

COPY ./docker-nginx-vhost.conf /etc/nginx/conf.d/docker-nginx-vhost.template

COPY docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

RUN chown -R nginx:nginx /frontend

RUN touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid && \
  chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /etc/nginx/conf.d/

ENTRYPOINT ["/docker-entrypoint.sh"]

USER nginx

CMD ["nginx", "-g", "daemon off;"]
