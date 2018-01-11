#!/bin/bash
source $(which virtualenvwrapper.sh)
workon hyphe-traph

status=$(echo $1 | sed 's/^\(.*\)$/\U\1/')
if [ -z "$status" ]; then
  echo "Please provide a status you want to crawl (IN, OUT, UNDECIDED or DISCOVERED)"
  exit
fi

echo "status,lru_prefixes,id,name,tags"
./hyphe_backend/test_client.py inline store.get_webentities "" False False "name" 100000 0 True |
  grep result |
  sed "s/^.* u'webentities': \[//" |
  sed "s/{u'status'/\n{u'status'/g" |
  grep -i "u'status': u'$status'" |
  sed "s/', u'[^']*': u'/\",\"/g" |
  sed "s/^{u'[^']*': u'/\"/" |
  sed "s/'}\(, \|]}\)$/\"/"

