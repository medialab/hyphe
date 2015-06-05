FROM node:0.10

WORKDIR /app

COPY ./*.json ./
COPY ./.bowerrc ./

RUN npm install

COPY ./app/bower_assets ./bower_assets
COPY ./app/conf ./conf
COPY ./app/css ./css
COPY ./app/img ./img
COPY ./app/js ./js
COPY ./app/partials ./partials
COPY ./app/res ./res
COPY ./app/views ./views
COPY ./app/*.html ./

RUN sed "s|/##WEBPATH##|//' + window.location.hostname + ':6978/hyphe|" ./conf/conf_default.js > ./conf/conf.js


EXPOSE 8000

CMD ["/app/node_modules/.bin/http-server", "-a", "0.0.0.0", "-p", "8000"]