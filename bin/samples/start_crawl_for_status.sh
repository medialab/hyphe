#!/bin/bash
source $(which virtualenvwrapper.sh)
workon hyphe-traph

statuses=$(echo $1 | sed 's/^\(.*\)$/\U\1/')
depth=$(echo $2 | grep "^[0-9]*$")

if [ -z "$statuses" ]; then
  echo "Please provide a status you want to crawl (IN, OUT, UNDECIDED or DISCOVERED)"
  exit
fi

if [ -z "$depth" ]; then
  echo "No depth provided, launching crawls with default depth of 1"
  depth=1
fi

./hyphe_backend/test_client.py inline store.get_webentities "" False False "name" 100000 |
  grep result |
  sed "s/^.* u'webentities': \[//" |
  sed "s/{u'status'/\n{u'status'/g" |
  grep "u'status': u'$statuses'" > /tmp/webentities_to_crawl.list

echo "Start crawl for entities with defined startpages"
cat /tmp/webentities_to_crawl.list |
  grep -v "'startpages': \[\]" |
  sed "s/^.*'id': u'//" |
  sed "s/'}.*$//" |
  while read id; do
    ./hyphe_backend/test_client.py crawl_webentity $id 1
  done

echo "Start crawl for entities without any startpage using their LRU prefixes"
cat /tmp/webentities_to_crawl.list |
  grep "'startpages': \[\]" |
  sed "s/^.*'id': u'//" |
  sed "s/'}.*$//" |
  while read id; do
    ./hyphe_backend/test_client.py crawl_webentity $id 1 False True
  done

rm /tmp/webentities_to_crawl.list

