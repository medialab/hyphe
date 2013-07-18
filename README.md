# Hyphe / Hypertext Corpus Initiative

Welcome to Hyphe: the Hypertext Corpus Initiative (HCI) project, developped by [SciencesPo's médialab](http://www.medialab.sciences-po.fr/) for the [DIME-SHS Equipex project](http://www.sciencespo.fr/dime-shs/).

Hyphe aims at providing a tool to crawl data from the web to generate networks between what we call WebEntities, which can be singles pages as well as a website or a combination of such.

The project relies on the following main components:

 * memory_structure: a JAVA Lucene instance to store the structure and links of the crawled data
 * hyphe_backend: Python controllers for crawling and backend API, with MongoDB buffer database to store crawled data
  + core: Twisted based JSON-RPC API controller
  + crawler: Scrapy spider
  + lib: shared libraries
 * hyphe_www_client: JavaScript web interface to constitute and explore web corpuses through the backend API

# Download the code for install

```bash
    git clone https://github.com/medialab/Hypertext-Corpus-Initiative HCI
    cd HCI
```

# Easy install for basic users, on Ubuntu/Debian
## Install dependencies, virtualenv and website with the installation script

Warning: run from HCI's root directory in which you downloaded the whole code. This will ask for sudo password once and for all, and install missing packages including Java (OpenJDK-6-JRE), Python (python-dev, pip, virtualEnv, virtualEnvWrapper), Apache2, PHP5, MongoDB, ScrapyD... If you'd like more choices and to know what's happening, you can open bin/install.sh and run the commands line by line, or switch to the [Advanced install part](#detailed-install-for-advanced-users-contributors-and-developers).

```bash
    bash bin/install.sh
```

## Set paths, ports and options

Configure Hyphe by first setting the server's options. Most default options should be good. Important options to set depending on your situation could be:
 * mongo-scrapy - proxy_host/proxy_port: in case you want the crawler to make the requests through a proxy
 * mongo-scrapy - project: in case you want to run multiple hyphe instances on the same machine
 * mongo-scrapy - download_delay: the time (in seconds) after which the crawler will time out on a webpage
 * memoryStructure - lucene.path: the directory in which the memoryStructure's data will be stored (can reach multiple gigaoctets)
 * twisted - port: the port through which the server and the web interface will communicate, has to be replicated in the hyphe_www_client's config
```bash
    vi config/config.json
```

Then adapt the twisted port set for the server to the web interface's config:
```bash
    vi hyphe_www_client/_config/config.js
```

And adapt your apache configuration to get access to the web interface, internally or publically. Default will make it accessible locally on [http://localhost/hyphe](http://localhost/hyphe).
```bash
    vi hyphe_www_client/_config/apache2.conf
```

## Run Hyphe

Hyphe relies on a web interface communicating with a server that must be running at all times.
To start the server, run:
```bash
    bash bin/start.sh
```

And to stop it:
```bash
    bash bin/stop.sh
```

As soon as it is started, you can visit the web interface online: [http://localhost/hyphe](http://localhost/hyphe).

# Detailed install for advanced users, contributors and developers
## Requirements

MongoDB, ScrapyD, JAVA (& Thrift for contributors/developers) are required for the backend to work: below is an example to install them all on an Ubuntu machine, using vim as the default text editor whenever required (feel free to use whichever of course). Every command here should be ran from HCI's root directory.

### Prerequisites:

* Install possible missing required basics:
```bash
    sudo apt-get install curl git vim python-dev python-pip
```

* Edit your `aptitude sources.list` file to add the following lines:

```bash
    sudo vi /etc/apt/sources.list
```
```bash
    deb http://archive.scrapy.org/ubuntu lucid main
    deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen
```

* Install the GPG keys for these package repositories and update aptitude's lists:

```bash
    curl -s http://docs.mongodb.org/10gen-gpg-key.asc | sudo apt-key add -
    curl -s http://archive.scrapy.org/ubuntu/archive.key | sudo apt-key add -
    sudo apt-get update
```

### [MongoDB](http://www.mongodb.org/) (a no-sql database server):

* Install MongoDB and its Python module (for use by ScrapyD):

```bash
    sudo apt-get install mongodb-10gen
    sudo pip install pymongo
```

* Adapt the default configuration to your needs (default settings are usually all right, full documentation is accessible [here](http://docs.mongodb.org/manual/reference/configuration-options/)) and restart MongoDB:

```bash
    sudo vi /etc/mongodb.conf
    sudo service mongodb restart
```

* (optional) Install the PHP web admin interface [RockMongo](http://rockmongo.com/wiki/installation?lang=en_us) to easily access MongoDB's databases in a browser

### [ScrapyD](http://scrapyd.readthedocs.org/en/latest/) (a crawler framework server):

* Install ScrapyD:

```bash
    sudo apt-get install scrapyd-0.17
```

* Adapt the default configuration to your needs and deploy it (proposed settings should be all right, full documentation is accessible [here](http://scrapyd.readthedocs.org/en/latest/#topics-scrapyd-config)) and restart ScrapyD:

```bash
    vi config/scrapyd.config
    sudo ln -s `pwd`/config/scrapyd.config /etc/scrapyd/conf.d/100-hyphe
    sudo service scrapyd restart
```

### Java / [Thrift](http://thrift.apache.org/) environment

Thrift [version 0.8](http://archive.apache.org/dist/thrift/0.8.0/) is necessary, but required only for developers, although other users should still have Java JRE installed.

```bash
    sudo apt-get install openjdk-6-jdk
    wget http://archive.apache.org/dist/thrift/0.8.0/thrift-0.8.0.tar.gz
    tar xvf thrift-0.8.0.tar.gz
    cd thrift-0.8.0
    ./configure --with-java --without-erlang
    make
    sudo make install
```

### Python environment:

It is recommended to use virtualenv with virtualenvwrapper:

```bash
    sudo pip install virtualenv
    sudo pip install virtualenvwrapper
    source /usr/local/bin/virtualenvwrapper.sh
    mkvirtualenv --no-site-packages HCI
    workon HCI
    pip install -r requirements.txt
    add2virtualenv .
    deactivate
```

## Configuration

### Backend server:

* Copy and adapt the sample `config.json.example` to `config.json` in the `config` directory:

```bash
    sed "s|##HCIPATH##|"`pwd`"|" config/config.json.example > config/config.json
    vi config/config.json
```

* Create the lucene-data directory defined in config/config.json
```bash
    mkdir -p lucene-data
```

### Web interface:

* Copy and adapt the sample `_config_default` directory to `_config` in the `hyphe_www_client` directory:

```bash
    cp -r hyphe_www_client/_config{_default,}
    vi hyphe_www_client/_config/config.js
```

* Adapt the default Apache configuration and install it:

For now, the web interface relies on an Apache/PHP server, so if needed:
```bash
    sudo apt-get install apache2 php5
```

Install Hyphe's web client's VirtualHost and configure it (sample conf provided will install on http://localhost/hyphe ):

```bash
    sed "s|##HCIPATH##|"`pwd`"|" hyphe_www_client/_config/apache2_example.conf > hyphe_www_client/_config/apache2.conf
    vi hyphe_www_client/_config/apache2.conf
    sudo ln -s `pwd`/hyphe_www_client/_config/apache2_example.conf /etc/apache2/sites-available/hyphe
    sudo a2ensite hyphe
    sudo service apache2 reload
```

Test the interface is properly set: http://localhost/hyphe


## Run Hyphe

```bash
    bash bin/start.sh
```

```bash
    bash bin/stop.sh
```


# Extra scripts for developers:
## Start the Memory structure

HCI's memory structure is a Java/Lucene based server which needs to run in background, whenever Hyphe is being used.
It can be simply started thanks to shell scripts in `bin`:

```bash
    bash bin/start_lucene.sh
```

Whenever the code in `memory_structure` is modified, the JAVA archive running the memory structure needs to be rebuilt:

```bash
    bash bin/build_thrift.sh
```

To adapt the API commands callable through Thrift, edit the files `src/main/java/memorystructure.thrift` and `src/main/java/fr/sciencespo/medialab/hci/memorystructure/MemoryStructureImpl.java`.


### Run the Core API server

HCI relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.
It can be started separately as follows:

```bash
    bash bin/start_core_api.sh
```

A simple client is provided to test the API in command-line, for instance:

```bash
    source /usr/local/bin/virtualenvwrapper.sh
    workon HCI
    ./hyphe_backend/test_client.py get_status
    ./hyphe_backend/test_client.py declare_page http://medialab.sciences-po.fr
    ./hyphe_backend/test_client.py declare_pages array http://medialab.sciences-po.fr http://www.sciences-po.fr
    ./hyphe_backend/test_client.py store.get_webentities
    ./hyphe_backend/test_client.py store.get_webentities array WE_ID_1 WE_ID_2 WE_ID_3
    ./hyphe_backend/test_client.py inline store.get_webentities
    ./hyphe_backend/test_client.py crawl_webentity WE_ID
```

The API functions are described in the [Wiki here](https://github.com/medialab/Hypertext-Corpus-Initiative/wiki/Core_API).


### Redeploy the Crawler's spider

HCI's crawler is implemented as a Scrapy spider which needs to be deployed on the ScrapyD server (the core API takes care of it every time it is restarted) (more information [here](http://jiminy.medialab.sciences-po.fr/hci/index.php/Scrapy_implementation_proposal)).
It can be deployed as follow for debug purposes:

```bash
    bash bin/deploy_scrapy_spider.sh
```

Whenever the ``config.json`` file or the code in ``hyphe_backend/crawler`` or ``hyphe_backend/lib/lru.py`` is modified, the spider needs to be redeployed on the Scrapy daemon instance to be applied. Running the core server will do so in any case.

