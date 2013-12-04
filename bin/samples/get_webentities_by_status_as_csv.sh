#!/bin/bash
source $(which virtualenvwrapper.sh)
workon HCI

status=$(echo $1 | sed 's/^\(.*\)$/\U\1/')
if [ -z "$status" ]; then
  echo "Please provide a status you want to crawl (IN, OUT, UNDECIDED or DISCOVERED)"
  exit
fi

echo "status,lru_prefixes,id,name,tags"
./hyphe_backend/test_client.py inline store.get_webentities "" False False "" False True |
  grep result |
  sed "s/{u'status'/\n{u'status'/g" |
  grep -i "u'status': u'$status'" |
  sed "s/', u'[^']*': u'/\",\"/g" |
  sed "s/^{u'[^']*': u'/\"/" |
  sed "s/'}\(, \|]}\)$/\"/"

