Installation
============


__Note:__ MongoDB being limited to 2Go databases on 32bit systems, it is recommanded to always install Hyphe on a 64bit machine.

__Warning:__ Hyphe's current release does not support multiple corpus. This feature will come soon, but at the moment building a different corpus requires to either install a new instance or to stop working on the previous corpus and change the settings to point to a different mongodb collection and lucene directory.


Like everywhere in this README, every example command showed here should be ran from Hyphe's root directory and sudo should be used only when explicitly mentioned.


### 1) Download the source code

```bash
    git clone https://github.com/medialab/Hypertext-Corpus-Initiative Hyphe
    cd Hyphe
```

From here on, you can also run ```bin/install.sh``` to go faster as with the release, or follow the next steps.


### 2) Get requirements and dependencies

[MongoDB](http://www.mongodb.org/) (a no-sql database server), [ScrapyD](http://scrapyd.readthedocs.org/en/latest/) (a crawler framework server), JAVA (and [Thrift](http://thrift.apache.org/) for contributors/developers) are required for the backend to work: below is an example to install them all on an Ubuntu machine.
All of this steps are adaptable to Debian and CentOS as can be read in the ```bin/install.sh``` script.

#### 2.1) Prerequisites:

Python 2.6/2.7
Java 6
MongoDB
Apache
ScrapyD
64bit

Devs : maven2+

Install possible missing required basics:

```bash
    sudo apt-get install curl wget git python-dev python-pip apache2 libapache2-mod-proxy-html fontconfig libfreetype6 libfreetype6-dev libfontconfig libstdc++6 libffi-dev
```
Or from CentOS:
```bash
    sudo yum install curl git python-devel python-setuptools python-pip httpd fontconfig freetype libfreetype.so.6 libfontconfig.so.1 libffi-devel openssl-devel #libstdc++.so.6
```

#### 2.2) Install [MongoDB](http://www.mongodb.org/), [ScrapyD](http://scrapyd.readthedocs.org/en/latest/) and [PhantomJS](http://phantomjs.org/):

- Install PhantomJS:

Hyphe currently uses PhantomJS 2.0 to ensure proper handling of websites using modern javascript such as Facebook.
The latest official release still being 1.9.7 while 2.0 is stil unstable in development and its compilation takes quite some time, so Hyphe ships for now with a precompiled binary for phantomjs 2.0.
It will be removed from the repository when the official 2.0 release is made. Until then you should not need to run the following command.

```bash
    #./bin/install_phantom.sh
```

- Edit your package manager source list to include official repositories for MongoDB and ScrapyD:

```bash
    # Install the GPG keys for these package repositories:
    curl -s http://docs.mongodb.org/10gen-gpg-key.asc | sudo apt-key add -
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 627220E7

    # Edit the /etc/apt/sources.list with your favorite text editor and add the following lines if they are not already present:
    deb http://archive.scrapy.org/ubuntu scrapy main
    deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen

    # Update the sources list
    sudo apt-get update

    # Install MongoDB and ScrapyD with txmongo and selenium
    sudo apt-get install mongodb-10gen
    sudo pip install txmongo>=0.5
    sudo pip install selenium==2.42.1
    sudo apt-get install scrapyd
```

- In CentOS, this is slightly more complex:
 * To add the MongoDB repository to yum do the following:

```bash
    echo "[mongodb]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/
gpgcheck=0
enabled=1" > mongodb.repo.tmp
    sudo mv mongodb.repo.tmp /etc/yum.repos.d/mongodb.repo
    # Then update yum's source list and install:
    sudo yum check-update
    sudo yum install mongo-10gen mongo-10gen-server
```

 * Install python's required libraries for the ScrapyD spiders and the local PhantomJS binary:

```bash
    sudo pip install txmongo>=0.5
    sudo pip install selenium==2.42.1
```

 * There is no official package for ScrapyD in CentOS yet, so we built one specifically which you can install as follow:

```bash
    sudo pip -q install Scrapy==0.18
    wget https://github.com/medialab/scrapyd/raw/medialab/rpms/scrapyd-1.0.1-2.el6.x86_64.rpm
    sudo rpm -i scrapyd-1.0.1-2.el6.x86_64.rpm
```

- You can test whether ScrapyD is properly installed and running by trying to access the following url: [http://localhost:6800/listprojects.json](http://localhost:6800/listprojects.json) which should return a json object with status "ok".

- Default settings are usually all right, but you can adapt MongoDB and ScrapyD's default configurations to your needs if you like. Full documentation is accessible for [MongoDB here](http://docs.mongodb.org/manual/reference/configuration-options/) and for [ScrapyD there](http://scrapyd.readthedocs.org/en/latest/#topics-scrapyd-config).
  Remember to restart the services after any configuration change:

```bash
    sudo service mongodb restart    # Warning: under CentOS, mongodb is called mongod
    sudo service scrapyd restart
```

- If you want, you can also optionnally install the PHP web admin interface [RockMongo](http://rockmongo.com/wiki/installation?lang=en_us) to easily access MongoDB's databases in a browser.

#### 2.3) Prepare the Java / [Thrift](http://thrift.apache.org/) environment:

- Java:

Any instance require at least the Java JRE 6 installed. You can test it by running ```java -version``` and in case it is missing run:

```bash
    sudo apt-get install openjdk-6-jre
    # Or in CentOS:
    # sudo yum install java-1.6.0-openjdk
```

Hyphe uses [Thrift version 0.8](http://archive.apache.org/dist/thrift/0.8.0/) to ensure the communication between the python Twisted core and the Java Lucene memoryStructure. Although, installing Thrift is only required for developers to build the jar archive which is included in the downloadable release. You can skip the following steps if you are using the release.

To install and use Thrift, one first needs to install the Java JDK, ant and maven:
```bash
    sudo apt-get install build-essential openjdk-6-jdk ant maven
```
In CentOS this is slightly more complex since there is no maven package:
```bash
    sudo yum install java-1.6.0-openjdk-devel ant
    wget http://www.eu.apache.org/dist/maven/maven-3/3.1.1/binaries/apache-maven-3.1.1-bin.tar.gz
    tar xvf apache-maven-3.1.1-bin.tar.gz
    sudo cp -r apache-maven-3.1.1 /usr/local/maven
    echo "export M2_HOME=/usr/local/maven
export PATH=${M2_HOME}/bin:${PATH}" > /tmp/maven.sh
    sudo cp /tmp/maven.sh /etc/profile.d/maven.sh
    source /etc/profile.d/maven.sh
```

- Thrift:

Then download and install Thrift:
```bash
    wget http://archive.apache.org/dist/thrift/0.8.0/thrift-0.8.0.tar.gz
    tar xvf thrift-0.8.0.tar.gz
    cd thrift-0.8.0
    ./configure --with-java --without-erlang --without-php
    make
    sudo make install
    cd ..
```

#### 2.4) Prepare the Python environment:

It is recommended to use virtualenv with virtualenvwrapper:

```bash
    sudo pip install virtualenv
    sudo pip install virtualenvwrapper
    source $(which virtualenvwrapper.sh)
    mkvirtualenv --no-site-packages hyphe
    workon hyphe
    pip install -r requirements.txt
    add2virtualenv $(pwd)
    deactivate
```

### 3) Prepare and configure

#### 3.0) Compile the Java Lucene memoryStructure (only if installing from repository instead of release):

This will need to be ran again every time the Java code in the memory_structure directory will be modified.

```bash
    bin/build_thrift.sh 
```

#### 3.1) Set the backend server configuration

* Deploy Hyphe's scrapyd config:

```bash
    sudo ln -s `pwd`/config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe
    sudo service scrapyd restart
```

* Copy and adapt the sample `config.json.example` to `config.json` in the `config` directory:

```bash
    sed "s|##HCIPATH##|"`pwd`"|" config/config.json.example > config/config.json
```

* Adjust the settings as explained in section [2) Configure](#2-configure).

* And create the lucene-data directory defined in config/config.json (depending on your possible modifications):

```bash
    mkdir -p lucene-data
```

#### 3.2) Set the frontend webapp configuration

* Install frontend's javascript dependencies:
 - Download abd install node: http://nodejs.org/download/
 - Install and use bower:
```bash
    sudo npm install -g bower
    cd hyphe_frontend
    bower install
```

* Copy and adapt the `conf_default.js` file to `conf.js` in the `hyphe_frontend/app/conf` directory:

```bash
    cp hyphe_frontend/app/conf/conf{_default,}.js
```

* Prepare Hyphe's Apache configuration:

```bash
    sed "s|##HCIPATH##|"`pwd`"|" config/apache2_example.conf |
      sed "s|##TWISTEDPORT##|6978|" |
      sed "s|##WEBPATH##|/hyphe|" > config/apache2.conf
```

* Install the VirtualHost:

```bash
    sudo ln -s `pwd`/hyphe_www_client/_config/apache2_example.conf /etc/apache2/sites-available/hyphe.conf
    sudo a2ensite hyphe.conf
    sudo service apache2 reload
```

Or in CentOS:

```bash
    sudo ln -s `pwd`/hyphe_www_client/_config/apache2_example.conf /etc/httpd/conf.d/hyphe.conf
    sudo service httpd reload
```

This will install Hyphe locally only first: [http://localhost/hyphe](http://localhost/hyphe). The page should be accessible even though the website should not work (since we did not start the server yet, see next section). To run the website at an url on a server, a few more adjustments are required, [see related section](#4-serve-on-the-web).

If the page is inaccessible and apache says "403 Forbidden", you probably have right issues. Apache's group (usually ```www-data```, ```apache``` or ```httpd```) needs read access to Hyphe's installation directory.

```bash
    sudo chmod -R g+rx $(pwd)
    sudo chown -R :www-data $(pwd)
```

On some distributions, if you installed from a /home directory, you may need to do this to your ```/home/<USER>``` directory. Or you can move the current install to another directory (/srv, /opt, ...), give it the rights and redo the above parts involving the PATH.


