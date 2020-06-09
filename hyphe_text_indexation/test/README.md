# Hyphe Text Indexation Tests

Functionnal testing of the text indecation process for Hyphe.
Those tests require crawling the web, it's a rather longer process than usual tests.

## How to run tests

### inside docker

Coming soon...

### outide docker

First you need to launch a text indexation version of Hyphe with docker (or without if you really want troubles)
```bash
$ cd hyphe
$ docker-compose -f docker-compose.yml -f docker-compose-text_indexation.yml up
```

Wait for all services to be up.
You can monitor the text indexation processus log like this :
```bash 
$ cd hyphe_text_indexation
$ tail -f log/hyphe_text_indexation.log
2020-06-09 14:47:37,098 MainProcess INFO waiting 5.0
2020-06-09 14:47:42,119 MainProcess INFO waiting 5.0
```

When you see throttling message piling you're good to go.

Prepare test environment : 
```bash
$ cd test
# use an env because it's a good thing right ?
$ pyenv virtualenv 3.7.6  hyphe_test_text_indexation
$ pyenv activate hyphe_test_text_indexation
# install deps
$ pip install -r requirements.txt
```

Launch tests and wait:
```bash
$ pytest
==== test session starts ====
platform linux -- Python 3.8.2, pytest-5.4.3, py-1.8.1, pluggy-0.13.1
rootdir: /home/pgi/dev/hyphe/hyphe_text_indexation/test
collected 8 items

test_indexation.py ........   

==== 8 passed, 2 warnings in 194.76s (0:03:14) ====
```


## Tests

[x] create a test corpus, remove it if exists
[x] crawl medialab website from statpages depth 0
[x] add Webentity creation rule on equipe
[x] test updates are waiting while crawl run
[x] once crawl finished, wait for updates to be processed
[x] compare number of pages in index and in traph by web entity
[x] create one web entity as child and check number of pages in parent and new child

[x] merge one web entity in parent
[x] test if web entity disapear from index & number of pages of parent web entity

[x] test query ouestware
[x] test extraction methods
[x] test reset script
[x] test multicorpus adding IETF ?
[ ] test query website RFC
[ ] test corpus with text option off
[ ] real crawls in parallel

# known issues

- packaging : ajouter pytest à dans un docker pour permettre de tester avec docker et gestion de la dépendance aux services
- documentation : documenter comment tester et dev les tests
- better resilience in exception management ? 
- refacto : changer sleep en while intelligent 
- refacto de la méthod create_corpus crawl et WECR utilisé deux fois
- d'autres tests : 
    - deux crawls en parallèle
    - reset 
- conf nginx ES hyphe (GET/POST sur search)