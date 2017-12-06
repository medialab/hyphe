#!/bin/sh 

CONFIGFILE=/frontend/app/conf/conf.js

/bin/cp /frontend/app/conf/conf_default.js $CONFIGFILE

sed --in-place "s|'serverURL'\s*,.*|'serverURL', '//' + window.location.hostname + ':' + window.location.port + '/api/')|" $CONFIGFILE

[[ ! -z ${HYPHE_GOOGLE_ANALYTICS_ID} ]] && sed --in-place "s|'googleAnalyticsId'\s*,.*|'googleAnalyticsId', '${HYPHE_GOOGLE_ANALYTICS_ID}')|" $CONFIGFILE


[[ ! -z ${HYPHE_DISCLAIMER} ]] && sed --in-place "s|'disclaimer'\s*,.*|'disclaimer', '${HYPHE_DISCLAIMER}')|" $CONFIGFILE

chmod -R 550 /frontend/app && chown -R nginx:nginx /frontend/app

exec "$@"
