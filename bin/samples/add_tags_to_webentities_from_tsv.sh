#!/bin/bash
source $(which virtualenvwrapper.sh)
workon hyphe-traph

CSVFILE=$1

if [ -z "$CSVFILE" ] || [ ! -f "$CSVFILE" ] || ! head -n 1 "$CSVFILE" | grep "^https\?://\S\+\s\+\S\+\s*$" > /dev/null; then
  echo "Please provide a TSV file composed of lines as 'url tag' separated by tabulations with no header line"
  echo "For instance:"
  echo "http://medialab.sciences-po.fr  SUPERTAG"
  echo "https://www.sciences-po.fr  Recherche"
  echo "http://wwww.medialab.sciences-po.fr  Z3"
  exit 1
fi

cat "$CSVFILE" | while read l; do
  url=$(echo $l | awk '{print $1}')
  tag=$(echo $l | awk '{print $2}')
  echo " - $url  -->  $tag"
  WE=$(./hyphe_backend/test_client.py inline store.get_webentity_for_url "$url")
  WEid=$(echo $WE | grep "$url" | sed "s/^.* u'id': u'//" | sed "s/'.*$//")
  if [ -z "$WEid" ]; then
    startpage=$(echo $WE | grep "\[u'added " | sed "s/^.* \[u'added //" | sed "s/'\], .*$//")
    if [ -z "$startpage" ]; then
      startpage=$(echo $WE | sed "s/^.* u'name': u'//" | sed "s/'.*$//")
    fi
    echo "!WARNING! Could not find webentity matching exactly url $url / Using WE with startpage $startpage"
    WEid=$(echo $WE | sed "s/^.* u'id': u'//" | sed "s/'.*$//")
  fi
  if [ -z "$WEid" ]; then
    echo "!ERROR! No WebEntity found for url $url"
  else
    ./hyphe_backend/test_client.py store.add_webentity_tag_value "$WEid" 'USER' "category" "$tag"
    echo
  fi
done

