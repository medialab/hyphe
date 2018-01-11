#!/bin/bash
source $(which virtualenvwrapper.sh)
workon hyphe-traph

OLDSTATUS=$1
NEWSTATUS=$2

if [ -z "$OLDSTATUS" ] || [ -z "$NEWSTATUS" ] || [ "$OLDSTATUS" == "$NEWSTATUS" ]; then
  echo "Please provide two different status values among (IN, OUT, UNDECIDED or DISCOVERED)"
  exit
fi

./hyphe_backend/test_client.py inline store.get_webentities_by_status "$OLDSTATUS" "name" 100000 |
  grep result |
  sed "s/^.* u'webentities': \[//" |
  sed "s/}, {u'/}\n{u'/g" |
  sed "s/^.*'id': u'//" |
  sed "s/'.*$//" |
  while read id; do
    ./hyphe_backend/test_client.py store.set_webentity_status "$id" "$NEWSTATUS"
  done

