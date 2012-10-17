#!/bin/bash

cd memory_structure/src/main/java/
thrift -gen java memorystructure.thrift
mv gen-java/fr/sciencespo/medialab/hci/memorystructure/thrift/* fr/sciencespo/medialab/hci/memorystructure/thrift 
rm -rf gen-java
cd ../../../
mvn -Dmaven.test.skip=true clean install

# Create javadoc on build_trift.sh 1
if [ ! -z $1 ]; then
  mvn javadoc:javadoc
fi

# edit fr/sciencespo/medialab/hci/memorystructure/MemoryStructureImpl.java

cd ../core/
thrift -gen py:twisted ../memory_structure/src/main/java/memorystructure.thrift
cd ..

# Starts the Lucene memory structure in debug mode
bash bin/start_lucene.sh 1

