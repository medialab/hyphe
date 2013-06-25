#!/bin/bash

./hyphe_backend/test_client.py inline store.get_webentities |
  grep result |
  sed "s/{u'status'/\n{u'status'/g" |
  grep "'UNDECIDED'" |
  sed "s/^.*'id': u'//" |
  sed "s/'}.*$//" |
  while read id; do
    ./hyphe_backend/test_client.py crawl_webentity $id 1 False True
  done

