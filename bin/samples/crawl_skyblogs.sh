#!/bin/bash
source $(which virtualenvwrapper.sh)
workon HCI

# ./bin/samples/crawl_skyblogs.sh to prepare the list of skyblogs
if [ -z "$1" ]; then

  ./hyphe_backend/test_client.py declare_page "http://www.skyrock.com/" |
    grep "u'id': u'"       |
    sed "s/^.*'id': u'//"  |
    sed "s/'.*$//" > skyrock_webentity.id

  ./hyphe_backend/test_client.py store.add_webentity_startpage $(cat skyrock_webentity.id) "http://www.skyrock.com/blog/"
  ./hyphe_backend/test_client.py crawl_webentity $(cat skyrock_webentity.id) 5

# ./bin/samples/crawl_skyblogs.sh 1 to crawl all skyblogs when crawl is over
else

  ./hyphe_backend/test_client.py inline store.postfixed_search_webentities "skyrock com" "name" |
    grep "u'result':"         |
    sed 's/}, {/\n/g'         |
    grep -v "'name': u'Www"   |
    sed "s/^.*'id': u'//"     |
    sed "s/'.*$//" |
    while read id; do
      echo "Start crawl for $id"
      ./hyphe_backend/test_client.py store.set_webentity_status $id in
      ./hyphe_backend/test_client.py crawl_webentity $id 25 False True
    done

fi
