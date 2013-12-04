#!/bin/bash

rm -f install.log
touch install.log

if cat /etc/issue 2> /dev/null | grep -i "debian\|ubuntu" > /dev/null; then
  echo "Install for Debian/Ubuntu"
  centos=false
  repos_tool='apt-get'
  repos_updt='update'
  python_dev='python-dev'
  apache='apache2'
  apache_path='apache2/sites-available'
  php='php5'
  mongo='mongodb'
  mongo_pack='mongodb-10gen'
  java='openjdk-6-jre'
else
  echo "Install for CentOS/Fedora/RedHat"
  centos=true
  repos_tool='yum'
  repos_updt='check-update'
  python_dev='python-devel python-setuptools'
  apache='httpd'
  apache_path='httpd/conf.d'
  php='php'
  mongo='mongod'
  mongo_pack='mongo-10gen mongo-10gen-server'
  java='java-1.6.0-openjdk'
fi
echo "-----------------------"

# Install possible missing packages
echo "Install dependencies..."
echo "-----------------------"
echo
sudo $repos_tool $repos_updt > /dev/null || $centos || exit 1
sudo $repos_tool -y install curl git vim $python_dev python-pip $apache $php >> install.log || exit 1
if $centos; then
  sudo chkconfig --levels 235 httpd on || exit 1
  sudo service httpd restart || exit 1
fi
echo

# Check SELinux
if test -x /usr/sbin/sestatus && sestatus | grep "enabled" > /dev/null; then
  echo "WARNING: SELinux is enabled on your machine and may cause issues with mongo, twisted and thrift"
  echo
fi

# Prepare repositories for MongoDB and ScrapyD
echo "Add source repositories..."
echo "--------------------------"
echo
if $centos; then
  if ! test -f /etc/yum.repos.d/mongodb.repo; then
    echo "[mongodb]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/
gpgcheck=0
enabled=1" > mongodb.repo.tmp
    sudo mv mongodb.repo.tmp /etc/yum.repos.d/mongodb.repo
  fi
else
  curl -s http://docs.mongodb.org/10gen-gpg-key.asc | sudo apt-key add -
  curl -s http://archive.scrapy.org/ubuntu/archive.key | sudo apt-key add -
  sudo cp /etc/apt/sources.list{,.hyphebackup-`date +%Y%m%d-%H%M`}
  if ! grep "archive.scrapy.org" /etc/apt/sources.list > /dev/null; then
    cp /etc/apt/sources.list /tmp/sources.list
    echo >> /tmp/sources.list
    echo "# SCRAPYD repository, automatically added by Hyphe's install" >> /tmp/sources.list
    echo "deb http://archive.scrapy.org/ubuntu $(lsb_release -cs) main" >> /tmp/sources.list
    sudo mv /tmp/sources.list /etc/apt/sources.list
  fi
  if ! grep "downloads-distro.mongodb.org" /etc/apt/sources.list > /dev/null; then
    cp /etc/apt/sources.list /tmp/sources.list
    echo >> /tmp/sources.list
    echo "# MONGODB repository, automatically added by Hyphe's install" >> /tmp/sources.list
    echo "deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen" >> /tmp/sources.list
    sudo mv /tmp/sources.list /etc/apt/sources.list
  fi
fi
sudo $repos_tool $repos_updt >> install.log || $centos || exit 1
echo

# Install MongoDB
echo "Install and start MongoDB..."
echo "----------------------------"
echo
sudo $repos_tool -y install $mongo_pack >> install.log || exit 1
if $centos; then
  sudo chkconfig mongod on
fi
#possible config via : vi /etc/mongodb.conf
sudo service $mongo restart || exit 1
echo

# Install ScrapyD
echo "Install and start ScrapyD..."
echo "----------------------------"
echo
# Install pymongo as a global dependency for ScrapyD spiders to be able to use it
sudo pip -q install pymongo >> install.log || exit 1
if $centos; then
  python -c "import scrapy" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    pyversion=$(python -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if [ "$pyversion" == "2.6" ]; then
      sudo pip -q install Scrapy==0.18 >> install.log || exit 1
    else
      sudo pip -q install Scrapy >> install.log || exit 1
    fi
  fi
  # Under CentOS, use homemode ScrapyD RPM until officially validated and published
  # Use sudo rpm -e scrapyd to remove
  if ! which scrapyd > /dev/null 2>&1; then
    wget -q https://github.com/medialab/scrapyd/raw/medialab/rpms/scrapyd-1.0.1-2.el6.x86_64.rpm
    sudo rpm -i scrapyd-1.0.1-2.el6.x86_64.rpm >> install.log || exit 1
    rm -f scrapyd-1.0.1-2.el6.x86_64.rpm
  fi
else
  sudo apt-get -y install scrapyd >> install.log || exit 1
fi
#possible config via : vi config/scrapyd.config
sudo rm -f /etc/scrapyd/conf.d/100-hyphe
sudo ln -s `pwd`/config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe || exit 1
sudo service scrapyd restart
# test scrapyd server
sleep 5
if ! curl -s "http://localhost:6800/listprojects.json" > /dev/null 2>&1; then
  echo "Could not start ScrapyD server properly. Please check your install" && exit 1
fi
echo

# Install JAVA if necessary
echo "Check JAVA and install OpenJDK if necessary..."
echo "----------------------------------------------"
java -version > /dev/null 2>&1 || sudo $repos_tool -y install $java >> install.log || exit 1
echo

# Install Thrift for development instances cloned from source
if ! test -d hyphe_backend/memorystructure; then
  echo "Install Thrift..."
  echo "-----------------"
  echo "Install from source requires Thrift & Maven install to build Lucene Java server and Python API"
  echo "Trying now. Please install from releases for faster install or to avoid this"
  if ! which thrift > /dev/null 2>&1 || ! which mvn > /dev/null 2>&1 ; then
    ./bin/install_thrift.sh > install.log || exit 1
  fi
  if $centos; then
    source /etc/profile.d/maven.sh
  fi
  ./bin/build_thrift.sh > install.log || exit 1
  echo
fi

# Install Hyphe's VirtualEnv
echo "Install VirtualEnv..."
echo "---------------------"
echo
sudo pip -q install virtualenv >> install.log || exit 1
sudo pip -q install virtualenvwrapper >> install.log || exit 1
source $(which virtualenvwrapper.sh)
mkvirtualenv --no-site-packages HCI
workon HCI
pip install -r requirements.txt >> install.log || exit 1
add2virtualenv .
deactivate
echo

# Copy default config
echo "Prepare config and install Apache virtualhost..."
echo "------------------------------------------------"
echo
sed "s|##HCIPATH##|"`pwd`"|" config/config.json.example > config/config.json || exit 1
sed "s|##HCIPATH##|"`pwd`"|" bin/hyphe.example > bin/hyphe || exit 1
chmod +x bin/hyphe
mkdir -p lucene-data
cp -r hyphe_www_client/_config{_default,} || exit 1

# Prepare apache config
apache_name="hyphe"
if ! grep "$(pwd)/hyphe_www_client" /etc/$apache_path/$apache_name*.conf > /dev/null 2>&1; then
  instance=0
  while test -f /etc/apache2/sites-available/$apache_name.conf || test -f /etc/apache2/sites-available/$apache_name.conf || test -f /etc/httpd/conf.d/$apache_name.conf; do
    instance=$(($instance + 1))
    apache_name="hyphe-$instance"
  done
  sed "s|##HCIPATH##|"`pwd`"|" hyphe_www_client/_config/apache2_example.conf |
    sed "s|##WEBPATH##|$apache_name|" > hyphe_www_client/_config/apache2.conf || exit 1
  sudo ln -s `pwd`/hyphe_www_client/_config/apache2.conf /etc/$apache_path/$apache_name.conf || exit 1
fi
if ! $centos; then
  sudo a2ensite "$apache_name".conf || exit 1
fi
sudo service $apache reload
echo
if ! curl -s http://localhost/$apache_name > /dev/null 2>&1; then
  echo "WARNING: apache/httpd says FORBIDDEN, read access (r+x) to $(pwd) must be opened to the `apache` group"
  echo "sudo chmod -R g+rx DIR; sudo chown -R :apache DIR"
  echo "If you installed from a /home directory, you may need to do this to your /home/<USER> dir"
  echo "Or you can move the current install to another directory (/srv, /opt, ...), give it the rights and reinstall, this should be quick now"
  echo
  exit 1
fi

echo "Installation complete!"
echo "----------------------"
echo "You can now run bash bin/hyphe start and access Hyphe at http://localhost/$apache_name"
echo
