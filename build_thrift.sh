
cd memory_structure/src/main/java/
thrift -gen java memorystructure.thrift
mv gen-java/fr/sciencespo/medialab/hci/memorystructure/thrift/* fr/sciencespo/medialab/hci/memorystructure/thrift 
rm -rf gen-java
cd ../../../
mvn -Dmaven.test.skip=true clean install
mvn javadoc:javadoc

// edit fr/sciencespo/medialab/hci/memorystructure/MemoryStructureImpl.java

cd ../core/
thrift -gen py:twisted ../memory_structure/src/main/java/memorystructure.thrift
cd ..
#java -jar memory_structure/target/MemoryStructureExecutable.jar path-to-lucene=/home/boo/lucene
java -jar memory_structure/target/MemoryStructureExecutable.jar lucene.path=/home/boo/lucene

