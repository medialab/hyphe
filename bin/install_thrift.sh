#!/bin/bash

centos=true
if cat /etc/issue 2> /dev/null | grep -i "debian\|ubuntu" > /dev/null; then
  centos=false  
fi

# Install Java dependencies if required (openJDK6, ant, maven)
echo "Install Java dependencies"
echo "## Install Java dependencies" > install_thrift.log
if $centos; then
  java -version > /dev/null 2>&1 || sudo yum -y install java-1.6.0-openjdk-devel >> install_thrift.log || ( echo "[java] install failed" && exit 1 )
  sudo yum -y install ant >> install_thrift.log || ( echo "[ant] install failed" && exit 1 )
  # Install Maven from online binary since no yum repository exists
  maven=true
  mvn --version > /dev/null 2>&1 && maven=false
  if $maven; then
    echo "Install Maven for Centos"
    wget -a install_thrift.log http://www.eu.apache.org/dist/maven/maven-3/3.1.1/binaries/apache-maven-3.1.1-bin.tar.gz || ( echo "[maven] download failed" && exit 1 )
    tar xf apache-maven-3.1.1-bin.tar.gz >> install_thrift.log
    sudo cp -r apache-maven-3.1.1 /usr/local/maven || ( echo "[maven] bin deploy failed" && exit 1 )
    echo "export M2_HOME=/usr/local/maven
export PATH=${M2_HOME}/bin:${PATH}" > /tmp/maven.sh
    sudo cp /tmp/maven.sh /etc/profile.d/maven.sh || ( echo "[maven] path install failed" && exit 1 )
    source /etc/profile.d/maven.sh
  fi
else
  sudo apt-get -y install openjdk-6-jdk ant maven >> install_thrift.log || ( echo "[apt] java dependencies install failed" && exit 1 )
fi

# Install Thrift
echo "Install Thrift..."
echo "## Install Thrift" >> install_thrift.log
echo "...downloading..."
wget -a install_thrift.log http://archive.apache.org/dist/thrift/0.8.0/thrift-0.8.0.tar.gz || ( echo "[Thrift] download failed" && exit 1 )
tar xf thrift-0.8.0.tar.gz >> install_thrift.log
cd thrift-0.8.0
echo "...configuring..."
./configure --with-java --without-erlang --without-php >> ../install_thrift.log || ( echo "[Thrift] configure failed" && exit 1 )
if ! ( grep "Building Java Library.* : yes" ../install_thrift.log && grep "Building Python Library.* : yes" ../install_thrift.log ); then
  echo "[Thrift] configure could not prepare installation for both python and java"
  exit 1
fi
echo "...building..."
make >> install_thrift.log || ( echo "[Thrift] make failed" && exit 1 )
echo "...installing..."
sudo make install >> install_thrift.log || ( echo "[Thrift] make install failed" && exit 1 )
echo "...done"
cd ..

echo
echo "Thrift successfully installed for python and java"
