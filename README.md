# Hyphe / Hypertext Corpus Initiative

Welcome to Hyphe: the Hypertext Corpus Initiative (HCI) project, developped by [SciencesPo's médialab](http://www.medialab.sciences-po.fr/) for the [DIME-SHS Equipex project](http://www.sciencespo.fr/dime-shs/).

Hyphe aims at providing a tool to crawl data from the web to generate networks between what we call WebEntities, which can be singles pages as well as a website or a combination of such.

The project relies on the following main components:

 * memory_structure: a JAVA Lucene instance to store the structure and links of the crawled data
 * hyphe_backend: Python controllers for crawling and backend API, with MongoDB buffer database to store crawled data
  + core: Twisted based JSON-RPC API controller
  + crawler: Scrapy spider
  + lib: shared libraries
 * hyphe_www_client: a JavaScript web interface to constitute and explore web corpuses through the backend API

_Note:_ MongoDB being limited to 2Go databases on 32bit systems, it is recommanded to always install Hyphe on a 64bit machine.

_Warning:_ Hyphe's current release does not support multiple corpus. This feature will come soon, but at the moment building a different corpus requires to either install a new instance or to stop working on the previous corpus and change the settings to point to a different mongodb collection and lucene directory.


## Easy start from the release

Like everywhere in this README, every example command showed here should be ran from Hyphe's root directory.

### 1) Install

For an easy install, the best solution is to download directly the [release version](https://github.com/medialab/Hypertext-Corpus-Initiative/releases), which was built to run against various GNU/Linux distributions (Ubuntu, Debian, CentOS, ...).
Just uncompress the release archive, go into the directory and run the installation script.
This will ask at once for sudo rights, and install possible unsatisfied packages including Java (OpenJDK-6-JRE), Python (python-dev, pip, virtualEnv, virtualEnvWrapper), Apache2, PHP5, MongoDB, ScrapyD...
If you do not feel comfortable with this, read the script and run the steps line by line or follow the [Advanced install instructions](#detailed-advanced-install) below for more control on what is actually installed.

```bash
    tar xzvf hyphe-release-*.tar.gz
    cd Hyphe
    ./bin/install.sh
```

### 2) Configure

The default configuration should work by default for a local install (i.e. running on [http://localhost/hyphe](http://localhost/hyphe)), but you may want to provide a few finer settings. You can configure Hyphe's options by editing ```config/config.json```. Default options should fit most cases. Important options to set depending on your situation could be:
 * ```mongo-scrapy - proxy_host/proxy_port```: in case you want the crawler to make the requests through a proxy
 * ```mongo-scrapy - project```: in case you want to run multiple hyphe instances on the same machine
 * ```mongo-scrapy - max_depth```: the maximum depth allowed to the users for each individual crawl (meaning the number of clicks to be followed within a crawled WebEntity)
 * ```mongo-scrapy - download_delay```: the time (in seconds) after which the crawler will time out on a webpage
 * ```memoryStructure - lucene.path```: the directory in which the memoryStructure's data will be stored (can get as high as a few gigaoctets)
 * ```memoryStructure - log.level```: set to WARN or DEBUG to get more log within Lucene's log/memory-structure.log
 * ```twisted - port: the port through which the server and the web interface will communicate (_warning_ this requires to be replicated for the client in ```hyphe_www_client/_confi/config.json```)
 * ```precisionLimit```: the maximum precision to keep on links between crawled webpages, the value being the number of slashes after the root prefix of a WebEntity (see the wiki for more info)
 * ```DEBUG```: a value from 0 to 2 indicating the level of verbosity desired from the API core in log/hyphe-core.log


### 3) Run Hyphe

Hyphe relies on a web interface communicating with a server which must be running at all times.
To start, stop or restart the server, run:

```bash
    bin/hyphe <start|restart|stop>
```

As soon as it is running, you can visit the web interface on your local machine with the following url: [http://localhost/hyphe](http://localhost/hyphe).

You can check the logs in ```log/hyphe-core.log``` and ```log/hyphe-memorystructure.log```:

```bash
    tail -f log/hyphe-*.log
```


### 4) Serve on the web

To run on a server and not only locally, a few adjustments need to be performed:

* Adapt your apache configuration in ```hyphe_www_client/_config/apache2.conf``` with your personal settings (ServerName, ...)

* Adapt the web interface API endpoint in ```hyphe_www_client/_config/config.js``` by replacing localhost into the actual domain name, for instance:

```bash
    "SERVER_ADDRESS":"http://www.example.com:6978",
```

* If your server's security restrains access to the API port, you may want either to open the port in your proxy or iptables, or add a ProxyPass in your apache conf to redirect the port to a specific URL:

 - Install Apache's proxy module

```bash
    sudo apt-get install libapache2-mod-proxy-html
    sudo a2enmod proxy
    sudo a2enmod proxy_http
    sudo service apache2 restart
```
 - Add to the Apache configuration in ```hyphe_www_client/_config/apache2.conf``` the ProxyPass directives to redirect the port to the desired url, for instance:

```bash
    <Location /hyphe-api>
        ProxyPass http://www.example.com:6978/
        ProxyPassReverse http://www.example.com:6978/
    </Location>
```

 - Change the API endpoint in ```hyphe_www_client/_config/config.js``` to the newly defined, for instance:

```bash
    "SERVER_ADDRESS":"http://www.example.com/hyphe-api",
```


## Detailed advanced install
Like everywhere in this README, every example command showed here should be ran from Hyphe's root directory.

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

Install possible missing required basics:

```bash
    sudo apt-get install curl wget git python-dev python-pip apache2 php5
```
Or from CentOS:
```bash
    sudo yum install curl git python-devel python-setuptools python-pip httpd php
```

#### 2.2) Install [MongoDB](http://www.mongodb.org/) and [ScrapyD](http://scrapyd.readthedocs.org/en/latest/):

- Edit your package manager source list to include official repositories for MongoDB and ScrapyD:

```bash
    # Install the GPG keys for these package repositories:
    curl -s http://docs.mongodb.org/10gen-gpg-key.asc | sudo apt-key add -
    curl -s http://archive.scrapy.org/ubuntu/archive.key | sudo apt-key add -

    # Edit the /etc/apt/sources.list with your favorite text editor and add the following lines if they are not already present:
    deb http://archive.scrapy.org/ubuntu $(lsb_release -cs) main
    deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen

    # Update the sources list
    sudo apt-get update

    # Install MongoDB and ScrapyD with pymongo
    sudo apt-get install mongodb-10gen
    sudo pip install pymongo
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
    sudo pip install pymongo
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
    mkvirtualenv --no-site-packages HCI
    workon HCI
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

* Define the server path in the starter:

```bash
    sed "s|##HCIPATH##|"`pwd`"|" bin/hyphe.example > bin/hyphe
    chmod +x bin/hyphe
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

* Copy and adapt the sample `_config_default` directory to `_config` in the `hyphe_www_client` directory:

```bash
    cp -r hyphe_www_client/_config{_default,}
```

* Prepare Hyphe's Apache configuration:

```bash
    sed "s|##HCIPATH##|"`pwd`"|" hyphe_www_client/_config/apache2_example.conf |
      sed "s|##WEBPATH##|/hyphe/ > hyphe_www_client/_config/apache2.conf
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


### 4) Run and serve on the web

[See related sections in the simple install.](#3-run-hyphe)


## Extra info for developers:
### Run only the Core API server

Hyphe relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.
It can be started separately as follows:

```bash
    bin/start_standalone_core.sh
```

### Using the API in command-line

All of Hyphe's functionalities are not available from the web interface yet.
Although, some advanced routines (like starting a set of crawls on all IN webEntities for instance) can already be performed in command line with the API. The script ```hyphe_backend/test_client.py``` is a command-line caller of the core API. For instance:

```bash
    source $(which virtualenvwrapper.sh)
    workon HCI
    ./hyphe_backend/test_client.py get_status
    ./hyphe_backend/test_client.py declare_page http://medialab.sciences-po.fr
    ./hyphe_backend/test_client.py declare_pages array http://medialab.sciences-po.fr http://www.sciences-po.fr
    ./hyphe_backend/test_client.py store.get_webentities
    ./hyphe_backend/test_client.py store.get_webentities array WE_ID_1 WE_ID_2 WE_ID_3
    ./hyphe_backend/test_client.py inline store.get_webentities
    ./hyphe_backend/test_client.py crawl_webentity WE_ID
```

In ```bin/samples/``` can be found multiple examples of advanced routines ran direcly via the shell using the command-line client.

The API functions are [described in the Wiki](https://github.com/medialab/Hypertext-Corpus-Initiative/wiki/Core_API).


### Run only the Memory structure

Hyphe's memory structure is a Java/Lucene based server which needs to run in background, whenever Hyphe is being used.
It can be simply started thanks to shell scripts in `bin`:

```bash
    bin/start_standalone_lucene.sh
```

Whenever the code in `memory_structure` is modified, the JAVA archive running the memory structure needs to be rebuilt:

```bash
    bin/build_thrift.sh
```

To adapt the API commands callable through Thrift, edit the files `src/main/java/memorystructure.thrift` and `src/main/java/fr/sciencespo/medialab/hci/memorystructure/MemoryStructureImpl.java`.


#### Redeploy the Crawler's spider

Hyphe's crawler is implemented as a Scrapy spider which needs to be deployed on the ScrapyD server (the core API takes care of it every time it is restarted) (more information [here](https://github.com/medialab/Hypertext-Corpus-Initiative/wiki/Scrapy-implementation-proposal)).
It can be deployed as follow for debug purposes:

```bash
    bin/deploy_scrapy_spider.sh
```

Whenever the ``config.json`` file or the code in ``hyphe_backend/crawler`` or ``hyphe_backend/lib/urllru.py`` is modified, the spider needs to be redeployed on the Scrapy daemon instance to be applied. Running the core server will do so in any case.

