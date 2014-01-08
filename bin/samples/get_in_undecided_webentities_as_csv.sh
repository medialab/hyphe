#!/bin/bash
source $(which virtualenvwrapper.sh)
workon HCI

echo "status,urls_prefixes,id,name,tags"
./hyphe_backend/test_client.py inline store.get_webentities "" False False "" False True |
  grep result |
  sed "s/{u'status'/\n{u'status'/g" |
  grep "u'status': u'\(IN\|UNDECIDED\)'" |
  sed "s/', u'[^']*': u'/\",\"/g" |
  sed "s/^{u'[^']*': u'/\"/" |
  sed "s/'}\(, \|]}\)$/\"/"

