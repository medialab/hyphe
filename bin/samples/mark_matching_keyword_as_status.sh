#!/bin/bash
source $(which virtualenvwrapper.sh)
workon HCI

keyword=$(echo $1 | sed 's/^\(.*\)$/\1/')
statuses=$(echo $2 | sed 's/^\(.*\)$/\U\1/')

if [ -z "$keyword" ]; then
  echo "Please provide a keyword (status or tag) you want to search for and set the status to"
  exit
fi

if [ -z "$statuses" ]; then
  echo "Please provide a status you want to set to the searched webentity (IN, OUT, UNDECIDED or DISCOVERED)"
  exit
fi

./hyphe_backend/test_client.py inline store.get_webentities |
  grep result |
  sed "s/{u'status'/\n{u'status'/g" |
  grep "'$keyword'" |
  sed "s/^.*'id': u'//" |
  sed "s/'}.*$//" |
  while read id; do
    ./hyphe_backend/test_client.py store.set_webentity_status "$id" "$statuses"
  done

