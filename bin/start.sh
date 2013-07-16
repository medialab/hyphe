#!/bin/bash

mkdir -p log
bash bin/start_lucene.sh
sleep 1
source /usr/local/bin/virtualenvwrapper.sh
workon HCI
twistd -oy hyphe_backend/core.tac -l log/hyphe-core.log &
sleep 1

echo "Displaying logs now, ctrl+c will only quit display, run bash bin/stop.sh to stop Hyphe Server"
sleep 0.5

tail -f log/hyphe-*.log

