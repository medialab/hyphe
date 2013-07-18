#!/bin/bash

mkdir -p log

if test -f java-memstruct.pid; then
  if ps -p $(cat java-memstruct.pid) > /dev/null; then
    echo "Hyphe's Java Memory Structure is already running, please run bin/stop.sh or kill "$(cat java-memstruct.pid)
    exit 1
  else
    rm java-memstruct.pid
  fi
fi

# Run as debug mode on start_lucene.sh 1
if [ -z $1 ]; then
  log=""
else log="log.level=DEBUG"
fi

java -server -Xms256m -Xmx1024m -Xmn224m -XX:NewSize=224m -XX:MaxNewSize=224m -XX:NewRatio=3 -XX:SurvivorRatio=6 -XX:PermSize=128m -XX:MaxPermSize=128m -XX:+UseParallelGC -XX:ParallelGCThreads=2 -jar hyphe_backend/memorystructure/MemoryStructureExecutable.jar $log >> log/hyphe-memorystructure.log &
echo $! > java-memstruct.pid

