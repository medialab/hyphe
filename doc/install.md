# Manual Installation

__Notes:__
- Hyphe is intended to be installed using Docker on most OS (Windows, Mac OS X, Linux). Building manually is only possible under Linux distributions. It can be complex due to a variety of issues and is therefore not guaranteed. Please rather use the regular Docker install if you have little experience with command line and Linux administration.
- MongoDB is limited to 2GB databases on 32bit systems, so we recommend to always install Hyphe on a 64bit machine.
- Do __not__ add `sudo` to any of the following example commands. Every piece of shell written here should be ran from Hyphe's root directory and `sudo` should only be used when explicitly listed.

The following installation instructions have been tested under Ubuntu 16.04.3 LTS. It should be possible to adapt these commands to older or more recent Ubuntu versions and diverse Debian and CentOS distributions (using `yum` instead of `apt` where necessary and so on).

[MongoDB Community Edition (v3)](http://www.mongodb.org/) (a NoSQL database server), [ScrapyD](http://scrapyd.readthedocs.org/en/latest/) (a crawler framework server) and Python 2.7 are required for the backend to work.


## 0) Get global requirements

First, install possible missing required basics using apt/aptitude:

```bash
sudo apt-get update
sudo apt-get install git curl apache2 build-essential gcc musl-dev python2.7-dev python-pip libxml2-dev libxslt1-dev openssl libssl-dev libffi-dev
```

Or, with yum under CentOS/RedHat like distributions, the packages names can be slightly different and some extra commands might be required:
```bash
sudo yum check-update
sudo yum install git curl httpd gcc python2.7-devel python-setuptools python-pip libxml2-devel libxslt-devel openssl-devel libffi-devel
# Fix possibly misnamed pip
pip > /dev/null || alias pip="python-pip"
# Activate Apache's autorestart on reboot
sudo chkconfig --levels 235 httpd on
sudo service httpd restart
```

Hyphe still relies on python2 for now which might disappear from official distributions repositories in the future. If you need to install it manually (for instance via pyenv), make sure to install the following system dependencies first (change -devel into -dev for all under apt based architectures such as Ubuntu or Debian):
`zlib-devel bzip2-devel openssl openssl-devel sqlite-devel readline-devel`


## 1) Clone the source code

```bash
git clone https://github.com/medialab/hyphe hyphe
cd hyphe
```


## 2) Install [MongoDB v3](http://www.mongodb.org/)

As they are usually very old, we recommend not to use the MongoDB packages shipped within distributions official repositories.

Rather follow official installation instructions: [https://docs.mongodb.com/v3.6/](https://docs.mongodb.com/v3.6/). Search the link for "MongoDB Community Edition" for your distribution, look for the documentation for version 3, and follow the instructions.

For instance for Ubuntu 18.04:

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-3.6.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo service mongod restart
```

For development and administrative use, you can also optionally install one of the following projects to easily access and manage MongoDB's databases:
- [RockMongo](http://rockmongo.com/wiki/installation?lang=en_us): a PHP web admin interface
- [RoboMongo](http://robomongo.org/): a shell-centric GUI


## 3) Install [ScrapyD](http://scrapyd.readthedocs.org/en/latest/)

Unfortunately, ScrapingHub does not provide anymore official repository packages for ScrapyD so it needs to be installed manually (cf [https://github.com/scrapy/scrapyd/issues/258](https://github.com/scrapy/scrapyd/issues/258)).

- Start by installing Scrapy and ScrapyD via pip (fixed versions are required for compatibility with Hyphe):

```bash
sudo pip install Scrapy==1.6.0
sudo pip install scrapyd==1.2.0
```

- Install Hyphe's config for ScrapyD:

```bash
sudo mkdir -p /etc/scrapyd
sudo ln -s `pwd`/hyphe_backend/crawler/scrapyd.config /etc/scrapyd/scrapyd.conf
```

- Create a `scrapy` user to run the service:

```bash
sudo adduser --system --home /var/lib/scrapyd --gecos "scrapy" --no-create-home --disabled-password --quiet scrapy
```

- Create ScrapyD's directories (adapt these to the directories defined in scrapyd.config if you changed them) and setup their rights for the `scrapy` user:

```bash
sudo mkdir -p /var/log/scrapyd
sudo mkdir -p /var/lib/scrapyd/eggs
sudo mkdir -p /var/lib/scrapyd/dbs
sudo mkdir -p /var/lib/scrapyd/items
sudo chown scrapy:nogroup /var/log/scrapyd /var/lib/scrapyd /var/lib/scrapyd/eggs /var/lib/scrapyd/dbs /var/lib/scrapyd/items
```

- Install globally the python dependencies required by Hyphe's Scrapy spider so that ScrapyD can use them:

```bash
sudo pip install hyphe_backend/crawler/requirements-scrapyd.txt
```

- Start ScrapyD manually:

__Disclaimer:__ The following method is ugly. ScrapyD should ideally rather be installed as a SystemD service (or, depending on your distribution, SysVinit or Upstart) which would be way better. You're very welcome to propose a proper reproducible alternative if you manage to make it work! :) (hints [here](http://scrapy-docs.yawik.org/build/html/install/scrapy.html) and [there](https://github.com/scrapy/scrapyd/issues/217) and from [Twisted's doc](http://twistedmatrix.com/documents/current/core/howto/systemd.html))

```bash
sudo nohup scrapyd -u scrapy -g --pidfile /var/run/scrapyd.pid -l /var/log/scrapyd/scrapyd.log &
```

And if you want it to always start when your machine boots, you can (again, very ugly instead of a service) set it as a `@reboot` cronjob by running `sudo crontab -e` and add the following line within:

```cronjob
@reboot         nohup scrapyd -u scrapy -g --pidfile /var/run/scrapyd.pid -l /var/log/scrapyd/scrapyd.log &
```

You can test whether ScrapyD is properly installed and running by querying [http://localhost:6800/listprojects.json](http://localhost:6800/listprojects.json). If everything is normal, you should see something like this:

```json
{"status": "ok", "projects": []}
```


## 4) Setup Hyphe's backend Python virtual environment

We recommend using virtualenv with virtualenvwrapper:

```bash
# Install VirtualEnv & Wrapper
sudo pip install virtualenv
sudo pip install virtualenvwrapper
source virtualenvwrapper.sh

# Create Hyphe's VirtualEnv & install dependencies
mkvirtualenv hyphe-traph
add2virtualenv $(pwd)
pip install -r requirements.txt
deactivate
```

**Warning:** the virtualenv's name (`hyphe-traph`) matters. Do not change it, or edit the value within the starter script `bin/hyphe`.


## 5) Build Hyphe's frontend

First install [nodeJs](https://nodejs.org/en/), preferably a [recent version from official source]https://nodejs.org/en/download/package-manager/) than deprecated old versions from your distribution's official repositories.

Then in Hyphe's frontend directory, install dependencies and build the bundle:

```bash
cd hyphe_frontend
npm install
cd ..
```


## 6) Configure Hyphe

### 6.1) Setup the backend

- Copy and adapt the sample `config.json.example` to `config.json` in the `config` directory:

```bash
sed "s|##HYPHEPATH##|"`pwd`"|" config/config.json.example > config/config.json
```

- Edit the `config.json` file and adjust the settings as explained in the [configuration documentation](config.md)


### 6.2) Setup the frontend

Copy and adapt the sample `conf_default.js` to `conf.js` in the `hyphe_frontend/app/conf` directory:

```bash
sed "s|##WEBPATH##|hyphe|" hyphe_frontend/app/conf/conf_default.js > hyphe_frontend/app/conf/conf.js
```


### 6.3) Serve everything with Apache

The backend core API relies on a Twisted web server serving on a dedicated port (defined as `core_api_port` in `config.json` just before). For external access, proxy redirection is handled by Apache.

- Copy and adapt the sample `apache2_example.conf` from the `config` directory:

```bash
twport=$(grep '"core_api_port"' config/config.json | sed 's/[^0-9]//g')
sed "s|##HYPHEPATH##|"`pwd`"|" config/apache2_example.conf |
sed "s|##TWISTEDPORT##|$twport|" |
sed "s|##WEBPATH##|hyphe|" > config/apache2.conf
```

- Install it as an Apache website:

On Debian/Ubuntu:

```bash
# Enable use of mod_proxy & mod_proxy_http
sudo a2enmod proxy
sudo a2enmod proxy_http

# Install & enable site
sudo ln -s `pwd`/config/apache2.conf /etc/apache2/sites-available/hyphe.conf
sudo a2ensite hyphe

# Reload Apache
sudo service apache2 reload
```

On CentOS/RedHat:

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

If you encounter issues here or would like to serve Hyphe on the web, please [see the related documentation](serve.md#if-you-installed-manually).


## 7) Run Hyphe!

To start, stop or restart the server's daemon, run (with the proper rights, so __no__ `sudo` if you installed as your user!):

```bash
bin/hyphe <start|restart|stop> [--nologs]
```

You should now be able to enjoy Hyphe at [http://localhost/hyphe](http://localhost/hyphe)!

By default the starter will display Hyphe's log in the console using `tail`. You can `Ctrl+C` whenever you want without shutting it off. Use the `--nologs` option to disable this.

You can always check all logs in the `log` directory.

