# Developpers documentation

Hyphe relies on the following main components:

 * memory_structure: a JAVA Lucene instance to store the structure and links of the crawled data
 * hyphe_backend: Python controllers for crawling and backend API, with MongoDB buffer database to store crawled data
  + core: Twisted based JSON-RPC API controller
  + crawler: Scrapy spider
  + lib: shared libraries
 * hyphe_frontend: a JavaScript web interface to constitute and explore web corpora through the backend API

## Call API from command-line

[API description](api.md)

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


## Develop frontend

- Install frontend's javascript dependencies:
 - Download and install node: http://nodejs.org/download/
 - Install and use bower:
```bash
    sudo npm install -g bower
    cd hyphe_frontend
    bower install
```


## Build & run the java memory structure

Whenever the code in `memory_structure` is modified, the JAVA archive running the memory structure needs to be rebuilt:

```bash
  bin/build_thrift.sh
```

To adapt the API commands callable through Thrift, edit the files `src/main/java/memorystructure.thrift` and `src/main/java/fr/sciencespo/medialab/hci/memorystructure/MemoryStructureImpl.java`.

Hyphe automatically handles running an instance of the memory stucture for each running corpus.

To run a single memory structure for tryouts, you can use the following command and example arguments:

```bash
  java -server -Xms256m -Xmx1024m -jar hyphe_backend/memorystructure/MemoryStructureExecutable.jar log.level=DEBUG thrift.port=13500 corpus=TEST
```


## Build & deploy a Scrapy crawler:

Hyphe's crawler is implemented as a Scrapy spider which needs to be deployed on the ScrapyD server (the core API automatically takes care of it for each corpus) (more information [here](https://github.com/medialab/Hypertext-Corpus-Initiative/wiki/Scrapy-implementation-proposal)).

For debug purposes, it can be deployed as follow for a specific corpus::

```bash
  bin/deploy_scrapy_spider.sh <corpus_name>
```

Whenever the ``config.json`` file or the code in ``hyphe_backend/crawler`` or ``hyphe_backend/lib/urllru.py`` is modified, the spider needs to be redeployed on the Scrapy daemon instance to be applied. Running the core server will do so in any case.


## Build API doc

```bash
  bin/build_apidoc.sh
```


## Build a release

```bash
  bin/build_release.sh <optional version_id>
```

