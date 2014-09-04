#!/bin/bash

if test -f twistd.pid; then
  if ps -p $(cat twistd.pid) > /dev/null; then
    echo "Hyphe's Core JsonRPC API is already running, please run bin/stop.sh or kill "$(cat twistd.pid)
    exit 1
  else
    rm twistd.pid
  fi
fi

source $(which virtualenvwrapper.sh)
workon hyphe
twistd -noy hyphe_backend/core.tac -l -

