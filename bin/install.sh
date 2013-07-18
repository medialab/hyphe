#!/bin/bash

# Install possible missing packages
echo "Install dependencies..."
echo "-----------------------"
echo ""
sudo apt-get update > /dev/null || exit 1
sudo apt-get -y install curl git vim python-dev python-pip apache2 php5 > install.log || exit 1
echo ""

# Install apt repositories for ScrapyD and MongoDB
echo "Add source repositories..."
echo "--------------------------"
echo ""
curl -s http://docs.mongodb.org/10gen-gpg-key.asc | sudo apt-key add -
curl -s http://archive.scrapy.org/ubuntu/archive.key | sudo apt-key add -
sudo cp /etc/apt/sources.list{,.hyphebackup-`date +%Y%m%d-%H%M`}
if ! grep "archive.scrapy.org" /etc/apt/sources.list > /dev/null; then
  cp /etc/apt/sources.list /tmp/sources.list
  echo "" >> /tmp/sources.list
  echo "# SCRAPYD repository, automatically added by Hyphe's install" >> /tmp/sources.list
  echo "deb http://archive.scrapy.org/ubuntu lucid main" >> /tmp/sources.list
  sudo mv /tmp/sources.list /etc/apt/sources.list
fi
if ! grep "downloads-distro.mongodb.org" /etc/apt/sources.list > /dev/null; then
  cp /etc/apt/sources.list /tmp/sources.list
  echo "" >> /tmp/sources.list
  echo "# MONGODB repository, automatically added by Hyphe's install" >> /tmp/sources.list
  echo "deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen" >> /tmp/sources.list
  sudo mv /tmp/sources.list /etc/apt/sources.list
fi
sudo apt-get update > install.log || exit 1
echo ""

# Install MongoDB
echo "Install and start MongoDB..."
echo "----------------------------"
echo ""
sudo apt-get -y install mongodb-10gen > install.log || exit 1
sudo pip -q install pymongo > install.log || exit 1
#possible config via : vi /etc/mongodb.conf
sudo service mongodb restart || exit 1
echo ""

# Install ScrapyD
echo "Install and start ScrapyD..."
echo "----------------------------"
echo ""
sudo apt-get -y install scrapyd-0.17 > install.log || exit 1
#possible config via : vi config/scrapyd.config
sudo ln -s `pwd`/config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe || exit 1
sudo service scrapyd restart
echo ""

# Install JAVA if necessary
echo "Check JAVA and install OpenJDK if necessary..."
echo "----------------------------------------------"
echo ""
java -version > /dev/null 2>&1 || sudo apt-get -y install openjdk-6-jre > install.log
echo ""

# Install Hyphe's VirtualEnv
echo "Install VirtualEnv..."
echo "---------------------"
echo ""
sudo pip -q install virtualenv > install.log || exit 1
sudo pip -q install virtualenvwrapper > install.log || exit 1
source /usr/local/bin/virtualenvwrapper.sh
mkvirtualenv --no-site-packages HCI
workon HCI
pip install -r requirements.txt > install.log || exit 1
add2virtualenv .
deactivate
echo ""

# Copy default config
echo "Prepare config and install Apache virtualhost..."
echo "------------------------------------------------"
echo ""
sed "s|##HCIPATH##|"`pwd`"|" config/config.json.example > config/config.json || exit 1
mkdir -p lucene-data
cp -r hyphe_www_client/_config{_default,} || exit 1

# Prepare apache config
sed "s|##HCIPATH##|"`pwd`"|" hyphe_www_client/_config/apache2_example.conf > hyphe_www_client/_config/apache2.conf  || exit 1
sudo ln -s `pwd`/hyphe_www_client/_config/apache2.conf /etc/apache2/sites-available/hyphe || exit 1
sudo a2ensite hyphe || exit 1
sudo service apache2 reload
echo ""

echo "Installation complete!"
echo "----------------------"
echo "You can now run bash bin/start.sh and access Hyphe at http://localhost/hyphe"

