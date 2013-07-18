#!/bin/bash

mkdir -p log
echo "Starting Hyphe's backend:"

if test -f java-memstruct.pid; then
  if ps -p $(cat java-memstruct.pid) > /dev/null; then
    echo "Hyphe's Java Memory Structure is already running, please run bin/stop.sh or kill "$(cat java-memstruct.pid)
    exit 1
  else
    rm java-memstruct.pid
  fi
fi

if test -f twistd.pid; then
  if ps -p $(cat twistd.pid) > /dev/null; then
    echo "Hyphe's Core JsonRPC API is already running, please run bin/stop.sh or kill "$(cat twistd.pid)
    exit 1
  else
    rm twistd.pid
  fi
fi

echo "Starting Hyphe's Java Memory Structure..."
bash bin/start_lucene.sh
sleep 1
echo "Starting Hyphe's Core JsonRPC API..."
source /usr/local/bin/virtualenvwrapper.sh
workon HCI
twistd -oy hyphe_backend/core.tac -l log/hyphe-core.log &


echo ""
ct=0
while ! ( test -f java-memstruct.pid && ps -p $(cat java-memstruct.pid) > /dev/null && test -f twistd.pid && ps -p $(cat twistd.pid) > /dev/null ); do
  ct=$(( $ct + 1 ))
  if [ $ct -gt 6 ]; then
    echo "Could not start Hyphe's backend server, please investigate logs in log/"
    bash bin/stop.sh > /dev/null 2>&1
    exit 1
  fi
  sleep 1
done
echo "Displaying logs now, ctrl+c will only quit display, run bash bin/stop.sh to stop Hyphe Server"
sleep 0.5
tail -f log/hyphe-*.log

