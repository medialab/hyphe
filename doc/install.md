# Manual Installation

__Notes:__
- Hyphe is intended to be installed using Docker on most OS (Windows, Mac OS X, Linux). Building manually is only possible under Linux distributions. It can be complex due to a variety of issues and is therefore not guaranteed. Please rather use the regular Docker install if you have little experience with command line and Linux administration.
- MongoDB is limited to 2GB databases on 32bit systems, so we recommend to always install Hyphe on a 64bit machine.
- Do __not__ add `sudo` to any of the following example commands. Every piece of shell written here should be ran from Hyphe's root directory and `sudo` should only be used when explicitly listed.

The following installation instructions have been tested under Ubuntu 16.04.3 LTS. It should be possible to adapt these commands to older or more recent Ubuntu versions and diverse Debian and CentOS distributions (using `yum` instead of `apt` where necessary and so on).

[MongoDB Community Edition (v3.6, the last free software version)](http://www.mongodb.org/) (a NoSQL database server), [ScrapyD](http://scrapyd.readthedocs.org/en/latest/) (a crawler framework server) and Python 2.7 are required for the backend to work.


## 0) Get global requirements

First, install possible missing required basics using apt/aptitude:

```bash
sudo apt-get update
sudo apt-get install git curl build-essential gcc musl-dev libxml2-dev libxslt1-dev openssl libssl-dev libffi-dev
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


## 2) Install [MongoDB v3.6](http://www.mongodb.org/)

Hyphe relies on the latest open source version of MongoDB community edition, which needs now to be installed using Docker:

```bash
docker pull mongo:3.6
```

Then when developing, you'll need to run your MongoDB Docker image in a dedicated terminal with the following command:

```bash
docker run --rm -p 27017:27017 -v mongo-data:/data/db --name mongo-hyphe mongo:3.6 mongod --smallfiles --bind_ip 0.0.0.0 --setParameter failIndexKeyTooLong=false
```

For development and administrative use, you can also optionally install the following project to easily access and manage MongoDB's databases:
- [RoboMongo](http://robomongo.org/): a shell-centric GUI



## TODO : Install pyenv



## 3) Install [ScrapyD](http://scrapyd.readthedocs.org/en/latest/)

Hyphe uses an old version of ScrapyD which is not packaged so we will install it locally in a dedicated pyenv environment.

```bash
mkdir scrapyd
pyenv install 3.12.4
pyenv virtualenv 3.12.4 scrapyd
cd scrapyd
pyenv local scrapyd
pip install -r ../hyphe_backend/crawler/requirements-scrapyd.txt
ln -s ../hyphe_backend/crawler/scrapyd.config scrapyd.conf
```

Then when developing, you'll need to run your ScrapyD instance in a dedicated terminal as well with the following commands:

```
cd scrapyd
scrapyd
```

You can test whether ScrapyD is properly installed and running by querying [http://localhost:6800/listprojects.json](http://localhost:6800/listprojects.json). If everything is normal, you should see something like this:

```json
{"status": "ok", "projects": []}
```


## 4) Setup Hyphe's backend Python virtual environment

We recommend using pyenv:

```bash
# Install VirtualEnv
pyenv virtualenv 2.7.18 hyphe
pyenv local hyphe
cat requirements.txt | xargs -n 1 -L 1 pip install
pwd > ~/.pyenv/versions/hyphe/lib/python2.7/site-packages/hyphe.pth
```


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

- Copy and adapt the sample from the `config` directory `config.json.example` to `config.json`:

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

Or with anything else, just serve statically the hyphe_frontend/app directory with any web server, for instance with

python -m SimpleHTTPServer 8000


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

To start the server's daemon, run the following:

```bash
python hyphe_backend/core.tac
```

You should now be able to enjoy Hyphe at [http://localhost/hyphe](http://localhost/hyphe)!

By default the starter will display Hyphe's log in the console using `tail`. You can `Ctrl+C` whenever you want without shutting it off. Use the `--nologs` option to disable this.

You can always check all logs in the `log` directory.

