# Hyphe corpus's web pages text indexation

Text indexation is an infinite multiprocess service which will continuously index HTML pages from Hyphe corpora which store html contents.
See [Hyphe configuration](../doc/config.md) to see how to enable html storing feature.
More precisely the process first extract significant text from HTML before indexing (see configuration section to learn more).

The process makes sure to synchronize ElasticSearch indices following Hyphe memory structure.
One index by corpus, one document by web page (with html content), attributing the right web entity id even after changes made in hyphe after indexation.
This synchronisation can take some time, aggregation of pages by web entity is therefore not guaranteed to be accurate.

## configuration

### extraction methods
There are three extraction methods available to transform html into text :

- [textify](../html2text.py): '*simply* stripping html tags as designed by [Aaron Schwartz's heuristics](http://www.aaronsw.com/2002/html2text/html2text.py)
- [trafilatura](https://github.com/adbar/trafilatura): more advanced heuristic to extract main content removing navigation context
- [dragnet](https://github.com/dragnet-org/dragnet): machine learning based rules which works best on *press article styled* pages

The environment variable HYPHE_TXT_INDEXATION_EXTRACTION_METHODS allows to set one or more method to use.
It defaults to the three methods list: *"['textify','dragnet','trafilatura']"*

Extraction results will be stored in different document attributes (method name) in ElasticSearch (see the [mapping for more](../index_mappings.json)).
To ease a generic use of the index whatever extraction method is chosen, the *text* alias attribute points to one extraction method result.
This alias defaults to *textify* but can be set by the environment variable *HYPHE_TXT_INDEXATION_DEFAULT_EXTRACTION_METHOD*.

> Note that as Hyphe general settings, text extraction settings are the one which will be used by default for any new corpus created in Hyphe.
But those settings can be set differently by corpus.
The text indexation service doe not use the environment variables, it reads corpus options values stored in mongoDB.

### number of indexation workers
The indexation can used multiple processes to parallelise text extraction and indexation.
The number of workers can be set by either: 
- an environment variable HYPHE_TXT_INDEXATION_NB_INDEXATION_WORKERS
- *--nb-indexation-workers* command line option

This value defaults to 2.

### indexation batch size
The indexation groups pages to index them in batch (by corpus).
The maximum number of pages by batch can be set either by : 
- env variable HYPHE_TXT_INDEXATION_BATCH_SIZE
- *--batch-size* command line option

Default to 1000.

### frequency of web entity update
Pending synchronisation tasks of Web entity updates are applied (if possible) at a lower frequency than indexation tasks.
This parameter sets the number of main loop iterations to wait (by corpus) before trying to apply Web entity updates.
env variable HYPHE_TXT_INDEXATION_UPDATE_WE_FREQ, default to 5


### elasticsearch connection
Three environment variables:
- HYPHE_ELASTICSEARCH_HOST: default to "localhost" if not set
- HYPHE_ELASTICSEARCH_PORT: default to 9200 if not set
- HYPHE_ELASTICSEARCH_TIMEOUT_SEC: maximum time to wait for ES to be up. Default to 30s if not set

### mongo connection
two environment variables:
- HYPHE_MONGO_HOST: default to "localhost" if not set
- HYPHE_MONGO_PORT: default to 27017 if not set


## usage

### with Docker

The text indexation process can be used in a docker service along hyphe by adding the dedicated docker compose file like this :

```bash
cd hyphe
docker-compose -f docker-compose.yml -f docker-compose-text_indexation.yml
```

This will add an ElasticSearch and the python text indexation services to the Hyphe stack. 

### without Docker

- start Hyphe:
```bash
cd hyphe
docker-compose -f docker-compose.yml
```
- deploy an ElasticSearch somewhere and set the env variables accordingly (see [configuration](#configuration)).
- install deps in a virtualenv
```bash
$ cd hyphe_text_indexation
$ pyenv install 3.7.9
$ pyenv virtualenv 3.7.9 hyphe_text_indexation
$ pyenv activate hyphe_text_indexation
# install deps
$ bash ./install_deps.sh
```
- start the process
```bash
python text_indexation.py
```

### logs

With or without Docker text indexation logs are available in *./log/hyphe_text_indexation.log*

## working principles

### main process

The main process is an infinite loop watching Hyphe's stack to update ElasticSearch indices accordingly.
It uses a mongo connection to retrieve information about corpora status and orchestrate the indexation workers which through a queue.
It needs a connection to an ElasticSearch (ES) server.

After initialisation (set log, check connections, init workers and queue), the infinite loop: 
- retrieves the list of hyphe corpora to index from mongoDB
- retrieves the list of Hyphe index in ES
- creates/deletes ES indices to match mongoDB list (removing a corpus destroy its ES index)
- feeds the indexation queue with batch of pages from corpus to index ordered by last modified in ES first
- flags finished crawling jobs whose all crawled pages has been indexed in ES
- applies the pending Web entity update tasks available in mongo (only once every HYPHE_TXT_INDEXATION_UPDATE_WE_FREQ iterations)
- if there were no new tasks in the current iteration, set up or increment a throttle time (+0.5s up to 5s)

To break the infinite loop, send a SIGINT or SIGTERM. The signal, caught only by the main process and not by the workers, triggers the closing procedures :
- empty the queue
- wait for the workers to finished their current task 
- terminate them nicely
- tag IN_BATCH pages as TO_INDEX to free them from deprecated batchs

### indexation task

The indexation tasks are executed in subprocesses. This means than the indexation service counts at minimum two processes (main + one worker).
The indexation tasks takes a batch UUID as input which is used to retrieve the pages including contents from mongoDB.
The process loops on pages to extract contents using the extraction methods from corpus configuration and prepare the batch of objects to index.
It submits the batch to ElasticSearch for indexation.
Finally it flags the indexed pages in mongoDB with "INDEXED" or "ERROR". In the later case, a *text_indexation_error* message is added to mongoDB page doc.


### Web entity updates tasks

The Web entity update task retrieves all pending Web entity updates tasks from one corpus.
After checking if the update can be safely applied (corresponding Web entity is not currently crawled, and all crawled pages has been indexed in ES), the update is applied on ES by a update_by_query call.


## develop environment

### use docker for the rest of hyphe

Edit the file `docker-compose-text_indexation.yml` and comment the lines about the `text_indexation` service.
Then :

```bash
cd hyphe
docker-compose -f docker-compose.yml -f docker-compose-text_indexation.yml  up
```

### prepare deps

```bash
pyenv virtualenv 3.7.9 hyphe_text_indexation
pyenv activate hyphe_text_indexation
bash install_deps.sh
```

### outside docker usage

```bash
$ python text_indexation.py --help
usage: text_indexation.py [-h] [--batch-size BATCH_SIZE]
                          [--nb-indexation-workers NB_INDEXATION_WORKERS]

optional arguments:
  -h, --help            show this help message and exit
  --batch-size BATCH_SIZE
  --nb-indexation-workers NB_INDEXATION_WORKERS
```
### tests

see [the test documentation](./test/README.md)
