#!/bin/bash

bash bin/start_lucene.sh
sleep 1
source /usr/local/bin/virtualenvwrapper.sh
workon HCI
twistd -oy hyphe_backend/core.tac -l log/hyphe-core.log &
sleep 1

