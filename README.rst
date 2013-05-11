===========================
Hypertext Corpus Initiative
===========================

Welcome to the Hypertext Corpus Initiative (HCI) project.

This project consist in the following components:

* memory_structure : JAVA Lucene instance to store crawled data
* hyphe_backend : Python controllers for crawling and backend API

  * core : Twisted based JSON-RPC API controller
  * crawler : Scrapy spider
  * lib : shared libraries

* hyphe_www_client : JavaScript web interface to constitute and explore web corpuses through the backend API

Requirements
============

MongoDB, ScrapyD, JAVA & Thrift are required for the backend to work: below is an example to install them all on an Ubuntu machine.

 * Edit your `̀`aptitude sources.list`` file to add the following lines:
  ``sudo vi /etc/apt/sources.list``
    ``deb http://archive.scrapy.org/ubuntu lucid main``
    ``deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen``

 * Install the GPG keys for these package repositories:
  ``curl -s http://docs.mongodb.org/10gen-gpg-key.asc | sudo apt-key add -``
  ``curl -s http://archive.scrapy.org/ubuntu/archive.key | sudo apt-key add -``

 * Update aptitude's source list:
  ``sudo apt-get update``

 * Install MongoDB and configure it:
  ``sudo apt-get install mongodb-10gen``
  ``sudo pip install pymongo``
  ``sudo vi /etc/mongodb.conf``

 * Install scrapyd and configure it:
  ``sudo apt-get install scrapyd-0.17``
  ``sudo vi /etc/scrapyd/conf.d/000-default``

 * Install Java and Thrift 0.8:
  ``sudo apt-get install openjdk-6-jdk``    /// WARNIGN CHECK JAVA VS OPENJDK
  ``wget http://archive.apache.org/dist/thrift/0.8.0/thrift-0.8.0.tar.gz``
  ``tar xvf thrift-0.8.0.tar.gz``
  ``cd thrift-0.8.0``
  ``./configure --with-java``
  ``make``
  ``sudo make install``

 * It is recommended to make a virtualenv to use then for the project, and run:
  ``sudo pip install virtualenv``
  ``sudo pip install virtualenvwrapper``
  ``source /usr/local/bin/virtualenvwrapper.sh``
  ``mkvirtualenv --no-site-packages HCI``
  ``workon HCI``
  ``pip install -r requirements.txt``
  ``add2virtualenv .``

Configuration
=============

Copy config.json.example to config.json and adapt your settings.

Create MongoDB
==============
cf https://github.com/medialab/reference_manager

HCI memory structure
====================

Whenever the code in ``memory_structure`` is modified, the JAVA archive running the memory structure needs to be rebuilt:

  ``bash bin/build_thrift.sh``

The memory structure instance needs to be started whenever hyphe is being used:

  ``bash bin/start_lucene.sh``

To adapt the API commands callable through Thrift, edit the files ``src/main/java/memorystructure.thrift`` and ``src/main/java/fr/sciencespo/medialab/hci/memorystructure/MemoryStructureImpl.java``.

HCI crawler
===========

The HCI crawler implemented as a Scrapy project. For more information see:
http://jiminy.medialab.sciences-po.fr/hci/index.php/Scrapy_implementation_proposal

Code is in ``hyphe_backend/crawler/hcicrawler/`` directory.

Whenever the ``config.json`` file or the code in ``hyphe_backend/crawler`` or ``hyphe_backend/lib/lru.py`` is modified, the spider needs to be redeployed on the Scrapy daemon instance configured:

  ``bash bin/deploy_scrapy_spider.sh``

HCI core
========

*TBD*
Link to Core API documentation
explain test_client.py

