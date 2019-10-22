#!/bin/bash

pass="$1"

./hyphe_backend/test_client.py list_corpus  |
 grep 'corpus_id'                           |
 sed "s/^.*pus_id': u'//"                   |
 sed "s/',//"                               |
 while read corpus; do
  echo $corpus
  ./hyphe_backend/test_client.py inline start_corpus "$corpus" "$pass" --no-convert-int
  while ./hyphe_backend/test_client.py json backup_corpus "$corpus" |
   grep '"ready": false,'; do
    sleep 1
  done
  ./hyphe_backend/test_client.py inline stop_corpus "$corpus"
done
