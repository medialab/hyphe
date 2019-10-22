# Developers documentation

## Architecture

Hyphe relies on the following main components/directories:

- [`hyphe-traph`](https://github.com/medialab/hyphe-traph): a dedicated database designed for WebEntities & WebEntityLinks handling
- `hyphe_backend`: Python 2.6/2.7 controllers for the crawling and backend API, with MongoDB buffer database to store crawled data
  + core.tac: a Twisted based JSON-RPC API controller
  + crawler: a Scrapy spider project to build and deploy on ScrapyD
  + lib: shared libraries between the two
  + traph: A couple of Twisted server/client for easy dialogue with the hyphe-traph processes
- `hyphe_frontend`: a JavaScript web application powered with Angular.js to constitute and explore web corpora through the backend API

Other useful directories are:
- `bin` for the executable scripts
- `config` where all useful configuration files are
- `doc` with this documentation among a few others


## Build & deploy a Scrapy crawler

Hyphe's crawler is implemented as a Scrapy spider which needs to be deployed for each corpus on the ScrapyD server (the core API automatically takes care of it whenever a corpus is created) (more information [here](https://github.com/medialab/hyphe/wiki/Scrapy-implementation-proposal)).

For debug purposes, it can be deployed as follow for a specific corpus:
```bash
cd hyphe_backend/crawler
python deploy.py <corpus_name>
```

Whenever `config.json` or the code in `hyphe_backend/crawler` and `hyphe_backend/lib/urllru.py` is modified, the spider for an existing corpus needs to be redeployed on the ScrapyD server to be taken into account. You can either do this by hand running the previous command, or by calling the Core API's method `crawl.deploy_crawler` ([see API documentation](api.md#commands-for-namespace-crawl)).


## Debug ScrapyD when developing with Docker

In the `docker-compose.yml` file, just add the following directive within the `services/crawler` section:
```yml
    ports:
      - "7800:6800"
```

This will allow you to access ScrapyD's web monitoring interface and API at http://localhost:7800/.


## Use the API from command-line

The entire frontend relies on calls to the core API which can also very well be scripted or reimplemented. This is especially useful when wanting to exploit some of Hyphe's functionalities which are not available from the web interface yet (for instance, tag all webentities from a list of urls with tag CSV, crawl all IN webentities, etc.).

All of the API's fonctions are catalogued and described in the [API documentation](api.md).

A simple python script `hyphe_backend/test_client.py` which could certainly be greatly improved provides a way to call the API from the command-line by stacking the arguments after the name of the called function, using keyword array before any rich argument such as an array or an object. For instance:

```bash
source $(which virtualenvwrapper.sh)
workon hyphe-traph
./hyphe_backend/test_client.py get_status
./hyphe_backend/test_client.py create_corpus test
./hyphe_backend/test_client.py declare_page http://medialab.sciences-po.fr test
./hyphe_backend/test_client.py declare_pages array '["http://medialab.sciences-po.fr", "http://www.sciences-po.fr"]' test
WEID=$(./hyphe_backend/test_client.py store.get_webentity_for_url http://medialab.sciences-po.fr test |
         grep "u'id':" |
         sed -r "s/^.*: u'(.*)',/\1/")
./hyphe_backend/test_client.py store.add_webentity_tag_value $WEID USER MyTags GreatValue test
./hyphe_backend/test_client.py crawl_webentity $WEID 1 False IN prefixes array '{}' test
```

In `bin/samples/` can be found multiple examples of advanced routines ran direcly via the shell using the command-line client, although these are presently deprecated as they were working with the old MONOCORPUS version of Hyphe and still need to be updated.


## Contribute to the frontend

The Javascript dependencies for the frontend are packaged as a bundle which needs to be rebuilt for changes to be taken into account whenever new dependencies are added. You can simply do so by running from the `hyphe_frontend` directory:

```bash
npm run build
```


## Build the [API's documentation](api.md)

```bash
bin/build_apidoc.sh
```

