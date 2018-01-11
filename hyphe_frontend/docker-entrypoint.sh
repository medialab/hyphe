#!/bin/sh 

CONFIGFILE=/frontend/app/conf/conf.js

/bin/cp /frontend/app/conf/conf_default.js $CONFIGFILE

# This sets the API url & handle the case of microsoft browsers not handling CORS correctly
sed --in-place "s|'serverURL'\s*,.*|'serverURL', '//' + window.location.hostname + ':' + window.location.port + window.location.pathname.slice(1) + '/api/')|" $CONFIGFILE

[[ ! -z ${HYPHE_GOOGLE_ANALYTICS_ID} ]] && sed --in-place "s|'googleAnalyticsId'\s*,.*|'googleAnalyticsId', '${HYPHE_GOOGLE_ANALYTICS_ID}')|" $CONFIGFILE


[[ ! -z ${HYPHE_DISCLAIMER} ]] && sed --in-place "s|'disclaimer'\s*,.*|'disclaimer', '${HYPHE_DISCLAIMER}')|" $CONFIGFILE


[[ ! -z ${HYPHE_BROWSER_URL} ]] && sed --in-place "s|'hyBroURL'\s*,.*|'hyBroURL', '${HYPHE_BROWSER_URL}')|" $CONFIGFILE

chmod -R 550 /frontend/app && chown -R nginx:nginx /frontend/app

exec "$@"
