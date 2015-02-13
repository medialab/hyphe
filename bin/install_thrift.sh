#!/bin/bash

source bin/common.sh

# Install Java dependencies if required (openJDK6, ant, maven)
echo "Install Java dependencies"
if isCentOS; then
  sudo yum -y install java-1.6.0-openjdk-devel > /dev/null || ( echo "[java] install failed" && exit 1 )
  sudo yum -y install ant > /dev/null || ( echo "[ant] install failed" && exit 1 )
  # Install Maven from online binary since no yum repository exists
  if ! which mvn > /dev/null 2>&1; then
    echo "Install Maven for Centos"
    wget http://www.eu.apache.org/dist/maven/maven-3/3.1.1/binaries/apache-maven-3.1.1-bin.tar.gz > /dev/null || ( echo "[maven] download failed" && exit 1 )
    tar xf apache-maven-3.1.1-bin.tar.gz > /dev/null
    sudo cp -r apache-maven-3.1.1 /usr/local/maven || ( echo "[maven] bin deploy failed" && exit 1 )
    echo "export M2_HOME=/usr/local/maven
export PATH=/usr/local/maven/bin:${PATH}" > /tmp/maven.sh
    sudo cp /tmp/maven.sh /etc/profile.d/maven.sh || ( echo "[maven] path install failed" && exit 1 )
    source /etc/profile.d/maven.sh
    rm -rf apache-maven-3.1.1*
  fi
else
  sudo apt-get -y install build-essential openjdk-6-jdk ant maven > /dev/null || ( echo "[apt] java dependencies install failed" && exit 1 )
fi

# Install Thrift
if ! which thrift > /dev/null 2>&1; then
  echo "Install Thrift..."
  echo "## Install Thrift"
  echo "...downloading..."
  wget http://archive.apache.org/dist/thrift/0.8.0/thrift-0.8.0.tar.gz || ( echo "[Thrift] download failed" && exit 1 )
  tar xf thrift-0.8.0.tar.gz > /dev/null
  rm -rf thrift-0.8.0.tar.gz
  cd thrift-0.8.0
  echo "...configuring (log in thrift-0.8.0/configure.log)..."
  ./configure --with-java --without-erlang --without-php > configure.log || ( echo "[Thrift] configure failed" && exit 1 )
  if ! ( grep "Building Java Library.* : yes" configure.log && grep "Building Python Library.* : yes" configure.log ); then
    echo "[Thrift] configure could not prepare installation for both python and java"
    exit 1
  fi
  echo "...building (log in thrift-0.8.0/make.log)..."
  make > make.log || ( echo "[Thrift] make failed" && exit 1 )
  echo "...installing..."
  sudo make install || ( echo "[Thrift] make install failed" && exit 1 )
  echo "...done"
  cd ..

  echo
  echo "Thrift successfully installed for python and java"
fi
