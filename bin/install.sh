#!/bin/bash

rm -f install.log
touch install.log

source bin/common.sh

if ! isCentOS; then
  if isDebian; then
    echo 'Install for Debian'
    mongorepo='debian wheezy/mongodb-org/3.2 main'
    installer='dpkg'
    scrapyd='scrapyd_1.0~r0_all.deb'
    scrapyd_path='https://github.com/medialab/scrapyd/raw/medialab-debian/debs'
  else
    echo 'Install for Ubuntu'
    mongorepo='ubuntu trusty/mongodb-org/3.2 multiverse'
    if lsb_release -a 2> /dev/nul 2> /dev/null | grep Codename | grep precise; then
      mongorepo='ubuntu precise/mongodb-org/3.2 multiverse'
    fi
  fi
  repos_tool='apt-get'
  repos_updt='update'
  packages='python-dev virtualenvwrapper libxml2-dev libxslt1-dev build-essential libffi-dev libssl-dev libstdc++6'
  apache='apache2'
  apache_path='apache2/sites-available'
  java='openjdk-6-jre'
else
  echo "Install for CentOS/Fedora/RedHat"
  sudo yum -y install epel-release >> install.log || exitAndLog install.log "installing epel-release"
  repos_tool='yum'
  repos_updt='check-update'
  packages='python-devel python-setuptools python-virtualenvwrapper libxml2-devel libxslt-devel gcc libffi-devel openssl-devel libstdc++.so.6'
  apache='httpd'
  apache_path='httpd/conf.d'
  java='java-1.6.0-openjdk'
  installer='rpm'
  scrapyd='scrapyd-1.0.1-3.el6.x86_64.rpm'
  scrapyd_path='https://github.com/medialab/scrapyd/raw/medialab-centos/rpms'
fi
echo "-----------------------"
echo "Log available in install.log"
echo

# Test locales properly set
if perl -e "" 2>&1 | grep "locale\|LC_" > /dev/null; then
  echo "WARNING: it seems like your locales are not set properly, please first fix them before installing by running commands such as the following:"
  echo
  echo "sudo $repos_tool install locales"
  echo 'export LC_ALL="en_US.UTF-8"'
  echo "$LANGUAGE
$LC_ALL
$LC_MESSAGES
$LC_COLLATE
$LC_CTYPE
$LANG" | grep -v unset | grep "\." | sort -u | while read loc; do
    echo "sudo locale-gen $loc"
  done
  echo "sudo dpkg-reconfigure locales"
  exit 1
fi

# Install possible missing packages
echo "Install dependencies..."
echo "-----------------------"
echo
echo " ...updating sources repositories..."
sudo $repos_tool $repos_updt > /dev/null 2>> install.log || isCentOS || exitAndLog install.log "updating repositories sources list"
echo " ...installing packages..."
sudo $repos_tool -y install curl wget python-pip $packages $apache >> install.log || exitAndLog install.log "installing packages"
if isCentOS; then
  pip > /dev/null 2>&1 || alias pip="python-pip"
  sudo chkconfig --levels 235 httpd on || exitAndLog install.log "setting httpd's autoreboot"
  sudo service httpd restart || exitAndLog install.log "starting httpd"
else
  sudo a2enmod proxy_http 2>&1 >> install.log || sudo $repos_tool -y install libapache2-mod-proxy-html 2>&1 >> install.log || exitAndLog install.log "installing mod proxy"
fi
echo

# Handle deprecated python 2.6
twistedversion=
scrapyversion="0.24.6"
extrarequirements=
if python -V 2>&1 | grep "2.6" > /dev/null; then
  twistedversion="==14.0"
  scrapyversion="0.18.4"
  extrarequirements="-py2.6"
fi 


# Check SELinux
if test -x /usr/sbin/sestatus && sestatus | grep "enabled" > /dev/null; then
  echo "WARNING: SELinux is enabled on your machine and may cause issues with mongo, twisted, thrift and apache"
  echo "info on issues with MongoDB can be found here http://docs.mongodb.org/manual/tutorial/install-mongodb-on-red-hat-centos-or-fedora-linux/#run-mongodb"
  echo
  echo "If you are installing from a home directory, you should probably reconsider and rather install in /opt, /usr, /var, etc."
  echo "Press a key to continue or Ctrl+C to cancel"
  echo
  read
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
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927 >> install.loga 2>&1 || exitAndLog install.log "downloading Mongo GPG key"
    if ! sudo rgrep "mongodb.org" /etc/apt/ | grep -v Binary > /dev/null; then
      cp /etc/apt/sources.list /tmp/sources.list
      echo >> /tmp/sources.list
      echo "# MONGODB repository, automatically added by Hyphe's install" >> /tmp/sources.list
      echo "deb http://repo.mongodb.org/apt/$mongorepo" >> /tmp/sources.list
      sudo mv /tmp/sources.list /etc/apt/sources.list
    fi
  fi
  # Prepare ScrapyD install
  if ! isDebian && ! which scrapyd > /dev/null 2>&1 && ! grep "archive.scrapy.org" /etc/apt/sources.list > /dev/null; then
    echo " ...preparing ScrapyD repository..."
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 627220E7 >> install.log 2>&1 || exitAndLog install.log "downloading Scrapy GPG key"
    if ! sudo rgrep "scrapy.org" /etc/apt/ | grep -v Binary > /dev/null; then
      cp /etc/apt/sources.list /tmp/sources.list
      echo >> /tmp/sources.list
      echo "# SCRAPYD repository, automatically added by Hyphe's install" >> /tmp/sources.list
      echo "deb http://archive.scrapy.org/ubuntu scrapy main" >> /tmp/sources.list
      sudo mv /tmp/sources.list /etc/apt/sources.list
    fi
  fi
fi
echo " ...updating sources repositories..."
sudo $repos_tool $repos_updt > /dev/null 2>> install.log || isCentOS || exitAndLog install.log "updating repositories sources list"
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
  elif ! which systemctl > /dev/null 2>&1; then
    sudo systemctl unmask mongodb
    sudo service mongod enable
    sudo service mongod restart
  fi
fi

# Install ScrapyD
echo "Install and start ScrapyD..."
echo "----------------------------"
echo
echo " ...installing TLS and other requirements for Scrapyd spiders"
sudo -H pip -q install --upgrade pip 2>&1 >> install.log
sudo -H pip -q install Twisted$twistedversion >> install.log || exitAndLog install.log "installing Twisted"
sudo -H pip -q install -r requirements-global-scrapyd.txt >> install.log || exitAndLog install.log "installing Scrapyd requirements"
echo
if ! which scrapyd > /dev/null 2>&1 ; then
  if ! isCentOS && ! isDebian; then
    # install python-support via dpkg on ubuntu 16+
    if ! sudo apt-get install python-support > /dev/null 2>&1; then
      wget -q "http://launchpadlibrarian.net/109052632/python-support_1.0.15_all.deb" -O /tmp/python-support.deb
      sudo dpkg -i /tmp/python-support.deb >> install.log 2>&1
    fi
    sudo apt-get -y install scrapy-0.24 >> install.log || exitAndLog install.log "installing Scrapy"
    sudo apt-get -y install scrapyd >> install.log || exitAndLog install.log "installing ScrapyD"
  else
  # Under CentOS & Debian, use homemade ScrapyD RPM & DEB until officially validated and published
  # Use `sudo rpm -e scrapyd` or `sudo dpkg -r scrapyd` to remove
    python -c "import scrapy" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
      echo " ...installing Scrapy extra dependencies..."
      sudo pip -q install w3lib==1.12 >> install.log || exitAndLog install.log "installing Twisted"
      echo " ...installing Scrapy..."
      sudo pip -q install Scrapy==$scrapyversion >> install.log || exitAndLog install.log "installing Scrapy"
    fi
    echo " ...downloading homemade ScrapyD package $scrapyd..."
    wget -q "$scrapyd_path/$scrapyd" --no-check-certificate
    echo " ...installing package..."
    sudo $installer -i $scrapyd >> install.log || exitAndLog install.log "installing ScrapyD"
    rm -f $scrapyd
  fi
else
  echo "...already installed..."
fi
echo "...setting config..."
#possible config via : vi config/scrapyd.config
sudo rm -f /etc/scrapyd/conf.d/100-hyphe
sudo cp -f `pwd`/config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe || exitAndLog install.log "configuring ScrapyD"
sudo pkill -9 -f scrapyd
echo "...restarting daemon..."
sudo service scrapyd start || sudo /etc/init.d/scrapyd start
# test scrapyd server
echo "...testing..."
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

# Install Hyphe's VirtualEnv
echo "Install VirtualEnv..."
echo "---------------------"
echo
if ! source $(which virtualenvwrapper.sh) >> install.log; then
  sudo pip -q install --upgrade virtualenvwrapper >> install.log || exitAndLog install.log "installing VirtualEnvWrapper"
  source $(which virtualenvwrapper.sh) >> install.log || exitAndLog install.log "loading VirtualEnvWrapper"
fi
mkvirtualenv --no-site-packages hyphe
workon hyphe
echo " ...installing python dependencies..."
pip install -r requirements${extrarequirements}.txt >> install.log || exitAndLog install.log "installing python dependencies"
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
  sudo cp -f `pwd`/config/apache2.conf /etc/$apache_path/$apache_name.conf || exitAndLog install.log "installing $apache_name configuration"
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
sudo service $apache restart || exitAndLog /dev/null "reloading apache"
echo
if curl -sL http://localhost/$apache_name/ | grep '403 Forbidden' > /dev/null 2>&1; then
  echo
  echo "WARNING: apache/httpd says FORBIDDEN, read access (r+x) to $(pwd) must be opened to the \"apache|httpd|www-data\" group"
  echo "sudo chmod -R g+rx DIR; sudo chown -R :apache DIR"
  echo "If you installed from a /home directory, you may need to do this to your /home/<USER> dir, but it might not be enough if SELinux is enabled."
  echo "But you should rather move your install directory to another one (/var/www/html, /srv, /opt, ...), give it the appropriate rights if required and restart bin/install.sh, this should be quick now."
  echo "You should then be all set to run \"bin/hyphe start\" and access it at http://localhost/$apache_name"
  echo
  exit 1
fi

echo "Installation complete!"
echo "----------------------"
echo "You can now run \"bin/hyphe start\" and access Hyphe at http://localhost/$apache_name"
echo
