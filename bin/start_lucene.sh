#!/bin/bash

# Run as debug mode on start_lucence.sh 1
if [ -z $1 ]; then
  log=""
else log="log.level=DEBUG"
fi

java -jar memory_structure/target/MemoryStructureExecutable.jar $log

