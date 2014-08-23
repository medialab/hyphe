#!/bin/bash

project=$1
option=$2

if [ -z "$option" ] || [ "$option" != "--noenv" ]; then
  source $(which virtualenvwrapper.sh)
  workon HCI
  option="--verbose"
else
  option=""
fi

add2virtualenv $(pwd)
cd hyphe_backend/crawler
python deploy.py "$project" $option

