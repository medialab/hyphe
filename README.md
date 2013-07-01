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


## Requirements

MongoDB, ScrapyD, JAVA & Thrift are required for the backend to work: below is an example to install them all on an Ubuntu machine, using vim as the default text editor whenever required (feel free to use whichever of course). Every command here should be ran from HCI's root directory:

```bash
    git clone https://github.com/medialab/Hypertext-Corpus-Initiative HCI
    cd HCI
```

### Prerequisites:

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
    sudo apt-get install scrapyd
```

* Adapt the default configuration to your needs and deploy it (proposed settings should be all right, full documentation is accessible [here](http://scrapyd.readthedocs.org/en/latest/#topics-scrapyd-config)) and restart ScrapyD:

```bash
    vi config/scrapyd.config
    sudo ln -s /etc/scrapyd/conf.d/100-hyphe config/scrapyd.config
    sudo service scrapyd restart
```

### Java / [Thrift](http://thrift.apache.org/) environment ([version 0.8](http://archive.apache.org/dist/thrift/0.8.0/) required until now):

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
```

## Configuration

### Backend server:

* Copy and adapt the sample `config.json.example` to `config.json` in the `config` directory:

```bash
    cp config/config.json{.example,}
    vi config/config.json
```

### Web interface:

* Copy and adapt the sample `_config_default` directory to `_config` in the `hyphe_www` directory:

```bash
    cp -r hyphe_www/_config{_default,}
    vi hyphe_www/_config/config.js
```

* Adapt the default Apache configuration and install it:

```bash
    vi hyphe_www/_config/apache2_example.conf
    sudo ln -s /etc/apache2/sites-available/hyphe hyphe_www/_config/apache2_example.conf
    sudo a2ensite hyphe
    sudo service apache2 reload
```


## Run Hyphe

### Start the Memory structure

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

### Deploy the Crawler

HCI's crawler is implemented as a Scrapy spider which needs to be deployed on the ScrapyD server (more information [here](http://jiminy.medialab.sciences-po.fr/hci/index.php/Scrapy_implementation_proposal)).
It can be deployed as follow:

```bash
    bash bin/deploy_scrapy_spider.sh
```

Whenever the ``config.json`` file or the code in ``hyphe_backend/crawler`` or ``hyphe_backend/lib/lru.py`` is modified, the spider needs to be redeployed on the Scrapy daemon instance configured:

### Run the Core API server

HCI relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.
It needs to be started as follows:

```bash
    bash bin/start_core_api.sh
```

A simple client is provided to test the APi in command-line, for instance:

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

