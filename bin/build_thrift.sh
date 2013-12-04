#!/bin/bash

# PREPARE STARTER
sed "s|##HCIPATH##|"`pwd`"|" bin/hyphe.example > bin/hyphe || exit 1
chmod +x bin/hyphe

# Build JAVA API with Thrift
cd memory_structure/src/main/java/
thrift -gen java memorystructure.thrift || exit 1
mv -f gen-java/fr/sciencespo/medialab/hci/memorystructure/thrift/* fr/sciencespo/medialab/hci/memorystructure/thrift
rm -rf gen-java
cd -

# Compile Lucene project and generate javadoc
cd memory_structure
mvn -Dmaven.test.skip=true clean install || exit 1
# Create javadoc on "build_trift.sh 1"
if [ ! -z $1 ]; then
  mvn javadoc:javadoc
fi
cd ..

# Build Python API with Thrift and include it into python libraries
cd hyphe_backend
rm -rf memorystructure tmpms
mkdir -p tmpms
thrift -gen py -out tmpms ../memory_structure/src/main/java/memorystructure.thrift || exit 1
mv tmpms/memorystructure memorystructure
cp ../memory_structure/target/MemoryStructureExecutable.jar memorystructure/
rm -rf tmpms
#thrift -gen py:twisted ../memory_structure/src/main/java/memorystructure.thrift
#mv gen-py.twisted/memorystructure .
#rm -rf gen-py.twisted
cd ..

# Starts the Lucene memory structure
# bash bin/start_lucene.sh $1

