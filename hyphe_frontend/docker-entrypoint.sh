#!/bin/sh

export NS=$(cat /etc/resolv.conf |grep nameserver|awk -F" " '{print $2}')

CONFIGFILE=/frontend/app/conf/conf.js

/bin/cp /frontend/app/conf/conf_default.js $CONFIGFILE

# This sets the API url & handle the case of microsoft browsers not handling CORS correctly
sed --in-place "s|'serverURL'\s*,.*|'serverURL', window.location.pathname === '/' ? '/api/' : window.location.pathname.replace(/\\\/$/, '') + '/api/')|" $CONFIGFILE

[[ ! -z "${HYPHE_GOOGLE_ANALYTICS_ID}" ]] &&
  sed --in-place "s|'googleAnalyticsId'\s*,.*|'googleAnalyticsId', '${HYPHE_GOOGLE_ANALYTICS_ID}')|" $CONFIGFILE

[[ ! -z "${HYPHE_DISCLAIMER}" ]] &&
  sed --in-place "s|'disclaimer'\s*,.*|'disclaimer', '${HYPHE_DISCLAIMER}')|" $CONFIGFILE

[[ ! -z "${HYPHE_BROWSER_URL}" ]] &&
  sed --in-place "s|'hyBroURL'\s*,.*|'hyBroURL', '${HYPHE_BROWSER_URL}')|" $CONFIGFILE

chmod -R 550 /frontend/app && chown -R nginx:nginx /frontend/app

envsubst '\$NS \$BACKEND_HOST \$BACKEND_PORT' < /etc/nginx/conf.d/docker-nginx-vhost.template > /etc/nginx/conf.d/default.conf

[[ ! -z "${HYPHE_HTPASSWORD_USER}" ]] && [[ ! -z "${HYPHE_HTPASSWORD_PASS}" ]] &&
  printf "${HYPHE_HTPASSWORD_USER}:${HYPHE_HTPASSWORD_PASS}\n" > .htpasswd &&
  sed -r --in-place 's|( location / \{)|\1\n        auth_basic Restricted;\n        auth_basic_user_file /frontend/.htpasswd;|' /etc/nginx/conf.d/default.conf

exec "$@"
