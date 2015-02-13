#!/bin/bash

source bin/common.sh

# Install Java dependencies if required (openJDK6, ant, maven)
echo " - Install Java dependencies"
if isCentOS; then
  sudo yum -y install java-1.6.0-openjdk-devel > /tmp/javadeps.log || exitAndLog /tmp/javadeps.log "[java] install failed"
  sudo yum -y install ant >> /tmp/javadeps.log || exitAndLog /tmp/javadeps.log "[ant] install failed"
  # Install Maven from online binary since no yum repository exists
  if ! which mvn > /dev/null 2>&1; then
    echo " - Install Maven for Centos"
    wget -q http://www.eu.apache.org/dist/maven/maven-3/3.1.1/binaries/apache-maven-3.1.1-bin.tar.gz || exitAndLog /dev/null "[maven] download failed"
    tar xf apache-maven-3.1.1-bin.tar.gz > /dev/null
    sudo cp -r apache-maven-3.1.1 /usr/local/maven || exitAndLog /dev/null "[maven] bin deploy failed"
    echo "export M2_HOME=/usr/local/maven
export PATH=/usr/local/maven/bin:${PATH}" > /tmp/maven.sh
    sudo cp /tmp/maven.sh /etc/profile.d/maven.sh || exitAndLog /dev/null "[maven] path install failed"
    source /etc/profile.d/maven.sh
    rm -rf apache-maven-3.1.1*
  fi
else
  sudo apt-get -y install build-essential openjdk-6-jdk ant maven > /tmp/javadeps.log || exitAndLog /tmp/javadeps.log "[apt] java dependencies install failed"
fi

# Install Thrift
if ! which thrift > /dev/null 2>&1; then
  echo " - Install Thrift..."
  echo " ...downloading..."
  wget -q http://archive.apache.org/dist/thrift/0.8.0/thrift-0.8.0.tar.gz || exitAndLog /dev/null "[Thrift] download failed"
  tar xf thrift-0.8.0.tar.gz > /dev/null
  rm -rf thrift-0.8.0.tar.gz
  cd thrift-0.8.0
  echo " ...configuring (log in thrift-0.8.0/configure.log)..."
  ./configure --with-java --without-erlang --without-php > configure.log || exitAndLog configure.log "[Thrift] configure failed"
  if ! ( grep "Building Java Library.* : yes" configure.log && grep "Building Python Library.* : yes" configure.log ); then
    echo "[Thrift] configure could not prepare installation for python and java. Read configure.log to find out why"
    exit 1
  fi
  echo " ...building (log in thrift-0.8.0/make.log)..."
  make > make.log || exitAndLog make.log "[Thrift] make failed"
  echo " ...installing..."
  sudo make install > make.log || exitAndLog make.log "[Thrift] make install failed"
  echo " ...done."
  cd ..

  echo
  echo "Thrift successfully installed for python and java"
fi
