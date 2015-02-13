#!/bin/bash

rm -f install.log
touch install.log

source bin/common.sh

if ! isCentOS; then
  if isDebian; then
    echo "Install for Debian"
    mongorepo="debian-sysvinit"
    scrapyd="scrapyd-0.17"
  else
    echo "Install for Ubuntu"
    mongorepo="ubuntu-upstart"
    scrapyd="scrapyd"
  fi
  repos_tool='apt-get'
  repos_updt='update'
  packages='python-dev libxml2-dev libxslt1-dev build-essential libffi-dev libssl-dev libstdc++6'
  apache='apache2'
  apache_path='apache2/sites-available'
  apache_pack='apache2 libapache2-mod-proxy-html'
  java='openjdk-6-jre'
else
  echo "Install for CentOS/Fedora/RedHat"
  repos_tool='yum'
  repos_updt='check-update'
  packages='python-devel python-setuptools libxml2-devel libxslt-devel gcc libffi-devel openssl-devel libstdc++.so.6'
  apache='httpd'
  apache_path='httpd/conf.d'
  apache_pack='httpd'
  java='java-1.6.0-openjdk'
fi
echo "-----------------------"
echo "Log available in install.log"
echo

# Install possible missing packages
echo "Install dependencies..."
echo "-----------------------"
echo
echo " ...updating sources repositories..."
sudo $repos_tool $repos_updt > /dev/null || isCentOS || exitAndLog install.log "updating repositories sources list"
echo " ...installing packages..."
sudo $repos_tool -y install curl wget git python-pip $packages $apache_pack >> install.log || exitAndLog install.log "installing packages"
if isCentOS; then
  pip > /dev/null || alias pip="python-pip"
  sudo chkconfig --levels 235 httpd on || exitAndLog install.log "setting httpd's autoreboot"
  sudo service httpd restart || exitAndLog install.log "starting httpd"
fi
echo

# Check SELinux
if test -x /usr/sbin/sestatus && sestatus | grep "enabled" > /dev/null; then
  echo "WARNING: SELinux is enabled on your machine and may cause issues with mongo, twisted and thrift"
  echo "info on issues with MongoDB can be found herehttp://docs.mongodb.org/manual/tutorial/install-mongodb-on-red-hat-centos-or-fedora-linux/#run-mongodb" 
  echo
fi

# Prepare repositories for MongoDB and ScrapyD
echo "Add source repositories..."
echo "--------------------------"
echo
if isCentOS; then
  if ! which mongod > /dev/null 2>&1 && ! test -f /etc/yum.repos.d/mongodb.repo; then
    echo " ...preparing Mongo repository..."
    echo "[mongodb]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/
gpgcheck=0
enabled=1" > mongodb.repo.tmp
    sudo mv mongodb.repo.tmp /etc/yum.repos.d/mongodb.repo
  fi
else
  sudo cp /etc/apt/sources.list{,.hyphebackup-`date +%Y%m%d-%H%M`}
  # Prepare MongoDB install
  if ! which mongod > /dev/null 2>&1 ; then
    echo " ...preparing Mongo repository..."
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10 >> install.loga 2>&1 || exitAndLog install.log "downloading Mongo GPG key"
    if ! grep "downloads-distro.mongodb.org" /etc/apt/sources.list > /dev/null; then
      cp /etc/apt/sources.list /tmp/sources.list
      echo >> /tmp/sources.list
      echo "# MONGODB repository, automatically added by Hyphe's install" >> /tmp/sources.list
      echo "deb http://downloads-distro.mongodb.org/repo/$mongorepo dist 10gen" >> /tmp/sources.list
      sudo mv /tmp/sources.list /etc/apt/sources.list
    fi
  fi
  # Prepare ScrapyD install
  if ! which scrapyd > /dev/null 2>&1 && ! grep "archive.scrapy.org" /etc/apt/sources.list > /dev/null; then
    echo " ...preparing ScrapyD repository..."
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 627220E7 >> install.log 2>&1 || exitAndLog install.log "downloading Scrapy GPG key"
    if ! grep "archive.scrapy.org" /etc/apt/sources.list > /dev/null; then
      cp /etc/apt/sources.list /tmp/sources.list
      echo >> /tmp/sources.list
      echo "# SCRAPYD repository, automatically added by Hyphe's install" >> /tmp/sources.list
      echo "deb http://archive.scrapy.org/ubuntu scrapy main" >> /tmp/sources.list
      sudo mv /tmp/sources.list /etc/apt/sources.list
    fi
  fi
fi
echo " ...updating sources repositories..."
sudo $repos_tool $repos_updt >> install.log || isCentOS || exitAndLog install.log "updating repositories sources list"
echo

# Install MongoDB
if ! which mongod > /dev/null 2>&1 ; then
  echo "Install and start MongoDB..."
  echo "----------------------------"
  echo
  sudo $repos_tool -y install mongodb-org >> install.log || exitAndLog install.log "installing MongoDB"
  #possible MongoDB config via : vi /etc/mongod.conf
  if isCentOS; then
    sudo chkconfig mongod on
    sudo service mongod restart || exitAndLog install.log "starting MongoDB"
  fi
fi

# Install ScrapyD
echo "Install and start ScrapyD..."
echo "----------------------------"
echo
if isCentOS; then
  python -c "import scrapy" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    pyversion=$(python -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    echo " ...installing Scrapy for $pyversion..."
    if [ "$pyversion" == "2.6" ]; then
      sudo pip -q install Scrapy==0.18 >> install.log || exitAndLog install.log "installing Scrapy"
    else
      sudo pip -q install Scrapy >> install.log || exitAndLog install.log "installing Scrapy"
    fi
  fi
  # Under CentOS, use homemade ScrapyD RPM until officially validated and published
  # Use sudo rpm -e scrapyd to remove
  if ! which scrapyd > /dev/null 2>&1 ; then
    echo " ...downloading homemade RPM for CentOS..."
    wget -q https://github.com/medialab/scrapyd/raw/medialab/rpms/scrapyd-1.0.1-2.el6.x86_64.rpm
    echo " ...installing RPM package..."
    sudo rpm -i scrapyd-1.0.1-2.el6.x86_64.rpm >> install.log || exitAndLog install.log "installing ScrapyD"
    rm -f scrapyd-1.0.1-2.el6.x86_64.rpm
  fi
else
  sudo apt-get -y install $scrapyd >> install.log || exitAndLog install.log "installing ScrapyD"
fi
#possible config via : vi config/scrapyd.config
sudo rm -f /etc/scrapyd/conf.d/100-hyphe
sudo ln -s `pwd`/config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe || exitAndLog install.log "configuring ScrapyD"
sudo pkill -9 -f scrapyd
sudo service scrapyd start
# test scrapyd server
count=0
while ! curl -s "http://localhost:6800/listprojects.json" > /dev/null 2>&1 && [ $count -lt 30 ]; do
  sleep 2
  count=$(($count + 2))
  if [ $count -eq 30 ]; then
    echo "Could not start ScrapyD server properly. Please check your install" && exit 1
  fi
done
echo

# Install local PhantomJS
if ! test -f bin/hyphe-phantomjs-2.0.0; then
  echo "Install PhantomJS..."
  echo "---------------------"
  ./bin/install_phantom.sh >> install.log || exitAndLog install.log "installing PhantomJS"
  echo
fi

# Install JAVA if necessary
echo "Check JAVA and install OpenJDK if necessary..."
echo "----------------------------------------------"
java -version > /dev/null 2>&1 || sudo $repos_tool -y install $java >> install.log || exitAndLog install.log "installing Java JRE"
echo

# Install Thrift for development instances cloned from source
if ! test -d hyphe_backend/memorystructure; then
  echo "Install Thrift..."
  echo "-----------------"
  echo " Install from source requires Thrift & Maven install to build Lucene Java server and Python API"
  echo " Trying now. Please install from releases for faster install or to avoid this"
  if ! which thrift > /dev/null 2>&1 || ! which mvn > /dev/null 2>&1 ; then
    ./bin/install_thrift.sh || exitAndLog /dev/null "installing Thrift"
  fi
  if isCentOS; then
    source /etc/profile.d/maven.sh
  fi
  echo " ...building hyphe's Lucene MemoryStructure with Thrift..."
  ./bin/build_thrift.sh >> install.log || exitAndLog install.log "building hyphe's memory structure with Thrift"
  echo
fi

# Install txmongo and selenium as global dependencies for ScrapyD spiders to be able to use it
echo "Install txMongo"
echo "---------------"
sudo pip -q install "txmongo>=0.5" >> install.log || exitAndLog install.log "installing txmongo"
echo

echo "Install Selenium"
echo "---------------"
sudo pip -q install "selenium==2.42.1" >> install.log || exitAndLog install.log "installing selenium"
echo

# Install Hyphe's VirtualEnv
echo "Install VirtualEnv..."
echo "---------------------"
echo
sudo pip -q install virtualenv >> install.log || exitAndLog install.log "installing virtualenv"
sudo pip -q install virtualenvwrapper >> install.log || exitAndLog install.log "installing virtualenvwrapper"
source $(which virtualenvwrapper.sh)
mkvirtualenv --no-site-packages hyphe
workon hyphe
echo " ...installing python dependencies..."
pip install -r requirements.txt >> install.log || exitAndLog install.log "installing python dependencies"
add2virtualenv $(pwd)
deactivate
echo

# Prepare default config
echo "Prepare config and install Apache virtualhost..."
echo "------------------------------------------------"
echo
echo " ...create directories..."
mkdir -p log lucene-data
echo " ...copy backend and frontend default configs..."
sed "s|##HYPHEPATH##|"`pwd`"|" config/config.json.example > config/config.json || exitAndLog install.log "configuring hyphe"
cp hyphe_frontend/app/conf/conf{_default,}.js

# apache config
apache_name="hyphe"
echo " ...configuring apache..."
sed "s|##WEBPATH##|$apache_name|" hyphe_frontend/app/conf/conf_default.js > hyphe_frontend/app/conf/conf.js || exitAndLog install.log "configuring frontend"

if ! grep "$(pwd)/hyphe_frontend" /etc/$apache_path/$apache_name*.conf > /dev/null 2>&1; then
  instance=0
  while test -f /etc/apache2/sites-available/$apache_name.conf || test -f /etc/apache2/sites-available/$apache_name.conf || test -f /etc/httpd/conf.d/$apache_name.conf; do
    instance=$(($instance + 1))
    apache_name="hyphe-$instance"
  done
  sed "s|##HYPHEPATH##|"`pwd`"|" config/apache2_example.conf |
    sed "s|##TWISTEDPORT##|6978|" |
    sed "s|##WEBPATH##|$apache_name|" > config/apache2.conf || exitAndLog install.log "configuring $apache_name"
  sudo ln -s `pwd`/config/apache2.conf /etc/$apache_path/$apache_name.conf || exitAndLog install.log "installing $apache_name configuration"
fi
if ! isCentOS; then
  echo " ...activating mod proxy for apache..."
  sudo a2ensite "$apache_name".conf >> install.log 2>&1 || exitAndLog install.log "activating apache config"
  sudo a2enmod proxy >> install.log 2>&1 || exitAndLog install.log "activating mod proxy"
  sudo a2enmod proxy_http >> install.log 2>&1 || exitAndLog install.log "activating mod proxy_http"
else
  if ! grep "^\s*LoadModule.*mod_proxy_http" /etc/httpd/conf/httpd.conf > /dev/null; then
    echo
    echo "WARNING: apache/httpd's mod_proxy and mod_proxy_http need to be activated for Hyphe to work. It usually is by default on CentOS but appears not here. Please do so and restart apache."
    echo "You should then be all set to run \"bin/hyphe start\" and access it at http://localhost/$apache_name"
    echo
    exit 1
  fi
fi
sudo service $apache reload || exitAndLog /dev/null "reloading apache"
echo
if curl -sL http://localhost/$apache_name/ | grep '403 Forbidden' > /dev/null 2>&1; then
  echo
  echo "WARNING: apache/httpd says FORBIDDEN, read access (r+x) to $(pwd) must be opened to the \"apache|httpd|www-data\" group"
  echo "sudo chmod -R g+rx DIR; sudo chown -R :apache DIR"
  echo "If you installed from a /home directory, you may need to do this to your /home/<USER> dir"
  echo "Or you can move the current install to another directory (/srv, /opt, ...), give it the rights and reinstall, this should be quick now"
  echo "You should then be all set to run \"bin/hyphe start\" and access it at http://localhost/$apache_name"
  echo
  exit 1
fi

echo "Installation complete!"
echo "----------------------"
echo "You can now run \"bin/hyphe start\" and access Hyphe at http://localhost/$apache_name"
echo
