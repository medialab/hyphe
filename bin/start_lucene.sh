#!/bin/bash

if [ -z $1 ]; then
  log=INFO
else log=DEBUG
fi

java -jar memory_structure/target/MemoryStructureExecutable.jar lucene.path=/home/boo/lucene log.level=$log

