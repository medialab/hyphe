#!/bin/bash

project=$1
option=$2

if [ -z "$option" ] || [ "$option" != "--noenv" ]; then
  source $(which virtualenvwrapper.sh)
  workon hyphe
  add2virtualenv $(pwd)
  option="--verbose"
else
  option=""
fi

cd hyphe_backend/crawler
python deploy.py "$project" $option

