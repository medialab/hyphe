# Installation

__Notes:__
- Hyphe is built to run on a limited list of GNU/Linux distributions. [Docker](https://www.docker.com/) can be used to install Hyphe locally on other systems including MacOs, see the [Docker doc](../README.md#docker-setup). Making it work on Windows might be feasible but is not supported.
- MongoDB is limited to 2Go databases on 32bit systems, so we recommand to always install Hyphe on a 64bit machine.
- Do __not__ add `sudo` to any of the following example commands. Every line of shell written here should be ran from Hyphe's root directory and `sudo` should only be used when explicitly listed.

The easiest way to install Hyphe is by uncompressing the [gzipped release](https://github.com/medialab/Hypertext-Corpus-Initiative/releases). It has been successfully tested on a variety of blank distributions of Ubuntu, Debian and CentOS. Please let us know if you get it working on other versions!

  Distribution  |   Version         | precision     |  OK ?
:--------------:|:-----------------:|:-------------:|:-------------:
    Ubuntu      |   12.04.5 LTS     | server        |   ✓
    Ubuntu      |   12.04.5 LTS     | desktop       |   ✓
    Ubuntu      |   14.04.1 LTS     | server        |   ✓
    Ubuntu      |   14.04.1 LTS     | desktop       |   ✓
    Ubuntu      |   14.10           | desktop       |   ✓
    Ubuntu      |   15.04           | desktop       |   —  (ScrapyD + Upstart issue with Ubuntu 15 so far)
    CentOS      |   5.7             | server        |   —  (issues due to missing upstart & python2.4)
    CentOS      |   6.4 Final       | server        |   ✓
    Debian      |   6.0.10 squeeze  | server        |   ✓
    Debian      |   7.5 wheezy      | server        |   ✓
    Debian      |   7.8 wheezy      | livecd gnome  |   ✓
    Debian      |   8.0 jessie      | livecd gnome  |   —  (MongoDB not supporting Debian 8 yet)
    Redhat      |   7.3 Maipo       | server        |   ✓  (Be careful to use step by step advanced installation)


Just uncompress the release archive, go into the directory and run the installation script.

Do not use `sudo`: the script will do so on its own and ask for your password only once. This works so in order to install all missing dependencies at once, including mainly Python (python-dev, pip, virtualEnv, virtualEnvWrapper...), Apache2, MongoDB & ScrapyD.


```bash
# WARNING: DO NOT prefix any of these commands with `sudo`!
tar xzvf hyphe-release-*.tar.gz
cd hyphe
./bin/install.sh
```

If you are not comfortable with this or if you prefer to install from git sources, please follow the steps below.


## 1) Clone the source code

```bash
git clone https://github.com/medialab/hyphe hyphe
cd hyphe
```

From here on, you can also run `bin/install.sh` to go faster as with the release, or follow the next steps.


## 2) Get requirements and dependencies

[MongoDB](http://www.mongodb.org/) (a NoSQL database server), [ScrapyD](http://scrapyd.readthedocs.org/en/latest/) (a crawler framework server) and Python 2.7 are required for the backend to work.


### 2.1) Prerequisites:

Install possible missing required basics:

For Debian/Ubuntu:
```bash
sudo apt-get update
sudo apt-get install curl wget python-dev python-pip apache2 libapache2-mod-proxy-html libxml2-dev libxslt1-dev build-essential libffi-dev libssl-dev libstdc++6-dev
```

Or for CentOS/Redhat:
```bash
sudo yum check-update
sudo yum install curl wget python-devel python-setuptools python-pip httpd libxml2-devel libxslt-devel gcc libffi-devel openssl-devel libstdc++.so.6

# Fix possibly misnamed pip
pip > /dev/null || alias pip="python-pip"

# Activate Apache's autorestart on reboot
sudo chkconfig --levels 235 httpd on
sudo service httpd restart
```


### 2.2) Install [MongoDB](http://www.mongodb.org/)

As they are usually very old, we recommand not to use the MongoDB packages shipped within distributions official repositories.
Below are basic examples to manually install MongoDB (3.0) on Debian/Ubuntu/CentOS, although it does not seem to be supported on all distributions yet, so please read [official documentation](http://docs.mongodb.org/manual/administration/install-on-linux/) for more details.
If you'd rather install an older version 2.x, you can follow the dedicated isntructions in the `bin/install.sh` script to see examples.

On Debian/Ubuntu:
```bash
# Install the GPG key for the package repository
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

# Add the repository to apt's sources list
sudo apt-get install lsb-release
distrib=$(cat /etc/issue | sed -r 's/^(\S+) .*/\L\1/')
listrepo="main"
if [ "$distrib" = "ubuntu" ]; then listrepo="multiverse"; fi
echo "deb http://repo.mongodb.org/apt/$distrib "$(lsb_release -sc)"/mongodb-org/3.0 $listrepo" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list

# Update apt's sources list & install
sudo apt-get update
sudo apt-get install mongodb-org
```

On CentOS/Redhat, this is slightly more complex:
```bash
# Test whether SELinux runs
# If it says enabled, you will have to do a few more steps after the installation, see here: http://docs.mongodb.org/manual/tutorial/install-mongodb-on-red-hat/#run-mongodb
sestatus

# Add the repository to yum's sources list
echo "[mongodb-org-3.0]
name=MongoDB Repository
baseurl=http://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.0/x86_64/
gpgcheck=0
enabled=1" | sudo tee /etc/yum.repos.d/mongodb-org-3.0.list

# Update yum's sources list & install
sudo yum check-update
sudo yum install mongodb-org

# Let MongoDB autostart on reboot
sudo chkconfig mongod on
sudo service mongod restart
```

For development and administrative use, you can also optionally install one of the following projects to easily access MongoDB's databases:
- [RockMongo](http://rockmongo.com/wiki/installation?lang=en_us): a PHP web admin interface
- [RoboMongo](http://robomongo.org/): a shell-centric GUI


### 2.3) Install [ScrapyD](http://scrapyd.readthedocs.org/en/latest/)

On all distribs, start by installing globally the python dependencies required by Hyphe's Scrapy spider so that ScrapyD can use them (versions are fixed to avoid breakage: [pymongo3 currently breaks txmongo](https://github.com/twisted/txmongo/issues/80)):

```bash
sudo pip install pymongo==2.7
sudo pip install txmongo==0.6
sudo pip install selenium==2.42.1
```

Then easily install ScrapyD on Ubuntu:

```bash
# Install the GPG key for the package repository
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 627220E7

# Add the repository to apt's sources list
echo "deb http://archive.scrapy.org/ubuntu scrapy main" | sudo tee /etc/apt/sources.list.d/scrapy.list

# Update apt's sources list & install
sudo apt-get update
sudo apt-get install scrapy-0.24
sudo apt-get install scrapyd
```

Or follow the next steps on CentOS & Debian: ScrapingHub unfortunately only provides ScrapyD packages for Ubuntu, so we had to build our own:

First install python scrapy globally via pip

```bash
sudo pip install Scrapy==0.18
```

Then for Debian:

```bash
# Download our homemade package...
wget --no-check-certificate "https://github.com/medialab/scrapyd/raw/medialab-debian/debs/scrapyd_1.0~r0_all.deb"

sudo dpkg -i scrapyd_1.0~r0_all.deb
rm -rf scrapyd_1.0~r0_all.deb

# You can later remove the homemade package by running:
# sudo dpkg -r scrapyd` to remove
```

Or for CentOS:

```bash
# Download our homemade package...
wget --no-check-certificate "https://github.com/medialab/scrapyd/raw/medialab-centos/rpms/scrapyd_1.0.1-3.el6.x86_64.rpm"

sudo rpm -i scrapyd_1.0.1-3.el6.x86_64.rpm
rm -rf scrapyd_1.0.1-3.el6.x86_64.rpm

# You can later remove the homemade package by running:
# sudo rpm -e scrapyd
```

Or for Redhat > v6:
The scrapyd's RPM is to old. You have to install Scrapy as python package:
```bash
#install scrapy
pip install scrapd==1.0.1

#create environnement
sudo mkdir /etc/scrapyd/conf.d
sudo mkdir /var/lib/scrapyd
cd /var/lib
#Change <user> with your user
sudo chown -R <user>:<user> scrapyd
sudo mkdir /var/log/scrapyd
cd /var/log
#Change <user> with your user
sudo chown -R <user>:<user> scrapyd

#
```

Finally, on Debian and Centos, add Hyphe's specific config for ScrapyD:

```bash
sudo /etc/init.d/scrapyd stop
sudo ln -s `pwd`/config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe
sudo /etc/init.d/scrapyd start
```

Or for Redhat > v6:
```bash
sudo ln -s `pwd`/config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe
nohup scrapyd &
```

You can test whether ScrapyD is properly installed and running by querying [http://localhost:6800/listprojects.json](http://localhost:6800/listprojects.json). If everything is normal, you should see something like this:

```json
{"status": "ok", "projects": []}
```

### 2.4) Setup a Python virtual environment with Hyphe's dependencies

We recommend using virtualenv with virtualenvwrapper:
```bash
# Install VirtualEnv & Wrapper
sudo pip install virtualenv
sudo pip install virtualenvwrapper
source $(which virtualenvwrapper.sh)

# Create Hyphe's VirtualEnv & install dependencies
mkvirtualenv --no-site-packages hyphe
workon hyphe
add2virtualenv $(pwd)
pip install -r requirements.txt
deactivate
```

### 2.5) [Unnecessary for now] Install [PhantomJS](http://phantomjs.org/)

__Important:__ Crawling with PhantomJS is currently only possible as an advanced option in Hyphe. Do not bother with this section except for advanced use or development.

Hyphe ships with a compiled binary of PhantomJS-2.0 for Ubuntu, unfortunately it is not cross-compatible with other distributions: so when on CentOS or Debian, you should compile your own from sources.

```bash
./bin/install_phantom.sh
```

Note that PhantomJS 1.9.7 is easily downloadable as binary, altough it uses a very outdated version of WebKit and PhantomJS 2+ is required to handle modern websites such as Facebook.


## 3) Prepare and configure

### 3.1) Setup the backend

- Copy and adapt the sample `config.json.example` to `config.json` in the `config` directory:

```bash
sed "s|##HYPHEPATH##|"`pwd`"|" config/config.json.example > config/config.json
```

- Edit the `config.json` file and adjust the settings as explained in the [configuration documentation](config.md)


### 3.2) Set the frontend

Copy and adapt the sample `conf_default.json` to `conf.json` in the `hyphe_frontend/app/conf` directory:
```bash
sed "s|##WEBPATH##|hyphe|" hyphe_frontend/app/conf/conf_default.js > hyphe_frontend/app/conf/conf.js
```


### 3.3) Serve everything with Apache

The backend core API relies on a Twited web server serving on a dedicated port (defined as `twisted.port` in `config.json` just before). For external access, proxy redirection is handled by Apache.

- Copy and adapt the sample `apache2_example.conf` from the `config` directory:

```bash
twport=$(grep '"twisted.port"' config/config.json | sed 's/[^0-9]//g')
sed "s|##HYPHEPATH##|"`pwd`"|" config/apache2_example.conf |
sed "s|##TWISTEDPORT##|$twport|" |
sed "s|##WEBPATH##|hyphe|" > config/apache2.conf
```

- Install it as an Apache's site:

On Debian/Ubuntu:

```bash
# Enable use of mod_proxy & mod_proxy_http
sudo a2enmod proxy
sudo a2enmod proxy_http

# Install & enable site
sudo ln -s `pwd`/config/apache2.conf /etc/apache2/sites-available/hyphe
sudo a2ensite hyphe

# Reload Apache
sudo service apache2 reload
```

On CentOS/Redhat:

```bash
# Apache's mod_proxy & mod_proxy_http usually ship with Httpd on CentOS machines but it might be missing.
# Ensure it is indeed present running the following command and google how to install it otherwise
grep -r "^\s*LoadModule.*mod_proxy_http" /etc/httpd/

# Install site
sudo ln -s `pwd`/config/apache2.conf /etc/httpd/conf.d/hyphe.conf

# Reload Apache
sudo service httpd reload
```

This will install Hyphe locally only first: [http://localhost/hyphe](http://localhost/hyphe). The page should be accessible even though the website should not work yet since we have not started the server, see next section.

If you encounter issues here or would like to serve Hyphe on the web, please [see the related documentation](serve.md).


### 3.4) Run Hyphe!

To start, stop or restart the server's daemon, run (with the proper rights, so __no__ `sudo` if you installed as your user!):

```bash
bin/hyphe <start|restart|stop> [--nologs]
```

You should now be able to enjoy Hyphe at [http://localhost/hyphe](http://localhost/hyphe)!
