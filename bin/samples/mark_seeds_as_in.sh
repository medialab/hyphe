#!/bin/bash

./hyphe_backend/test_client.py inline store.get_webentities |
  grep result |
  sed "s/{u'status'/\n{u'status'/g" |
  grep "'SEED'" |
  sed "s/^.*'id': u'//" |
  sed "s/'}.*$//" |
  while read id; do
    ./hyphe_backend/test_client.py store.set_webentity_status $id "IN"
  done

