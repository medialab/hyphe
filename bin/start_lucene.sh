#!/bin/bash

# Run as debug mode on start_lucene.sh 1
if [ -z $1 ]; then
  log=""
else log="log.level=DEBUG"
fi

java -server -Xms512m -Xmx2048m -Xmn224m -XX:NewSize=224m -XX:MaxNewSize=224m -XX:NewRatio=3 -XX:SurvivorRatio=6 -XX:PermSize=128m -XX:MaxPermSize=128m -XX:+UseParallelGC -XX:ParallelGCThreads=2 -jar memory_structure/target/MemoryStructureExecutable.jar $log

