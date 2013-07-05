#!/bin/bash

option=$1

if [ -z "$option" ] || [ "$option" != "--noenv" ]; then
  source /usr/local/bin/virtualenvwrapper.sh
  workon HCI
  option="--verbose"
else
  option=""
fi

cd hyphe_backend/crawler
python deploy.py $option

