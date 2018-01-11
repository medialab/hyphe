#!/bin/bash
source $(which virtualenvwrapper.sh)
workon hyphe-traph

TSVFILE=$1

if [ -z "$TSVFILE" ] || [ ! -f "$TSVFILE" ] || ! head -n 1 "$TSVFILE" | grep "^https\?://\S\+\s\+\S\+\s*$" > /dev/null; then
  echo "Please provide a TSV file composed of lines as 'url tag' separated by tabulations with no header line"
  echo "For instance:"
  echo "http://medialab.sciences-po.fr  OUT"
  echo "https://www.sciences-po.fr  undecided"
  echo "http://wwww.medialab.sciences-po.fr  IN"
  exit 1
fi

cat "$TSVFILE" | while read l; do
  url=$(echo $l | awk '{print $1}')
  stat=$(echo $l | awk '{print $2}')
  echo " - $url  -->  $tag"
  WE=$(./hyphe_backend/test_client.py inline store.get_webentity_for_url "$url")
  WEid=$(echo $WE | grep -v "No matching WebEntity found" | sed "s/^.* u'id': u'//" | sed "s/'.*$//")
  if [ -z "$WEid" ]; then
    echo "!ERROR! No WebEntity found for url $url"
  else
    WEid=$(echo $WE | sed "s/^.* u'id': u'//" | sed "s/'.*$//")
    ./hyphe_backend/test_client.py inline store.set_webentity_status "$WEid" "$stat"
    echo
  fi
done

