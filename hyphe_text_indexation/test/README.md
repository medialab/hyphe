# Hyphe Text Indexation Tests

Functionnal testing of the text indecation process for Hyphe.
Those tests require crawling the web, it's a rather longer process than usual tests.

## How to run tests

### inside docker

```bash 
docker-compose -f docker-compose.yml -f docker-compose-text_indexation-dev.yml -f docker-compose-test_text_indexation.yml up
```

After something like 2 minutes of a long log oh Hyphe working on the tests you should see the test result: 
```bash
frontend_1              | 172.19.0.8 - - [24/Jun/2020:10:12:11 +0000] "POST /api/ HTTP/1.1" 200 132 "-" "jsonrpclib/0.4.1 (Python 3.7.6)" "-"
frontend_1              | 172.19.0.8 - - [24/Jun/2020:10:12:11 +0000] "POST /api/ HTTP/1.1" 200 132 "-" "jsonrpclib/0.4.1 (Python 3.7.6)" "-"
frontend_1              | 172.19.0.8 - - [24/Jun/2020:10:12:11 +0000] "POST /api/ HTTP/1.1" 200 132 "-" "jsonrpclib/0.4.1 (Python 3.7.6)" "-"
frontend_1              | 172.19.0.8 - - [24/Jun/2020:10:12:11 +0000] "POST /api/ HTTP/1.1" 200 132 "-" "jsonrpclib/0.4.1 (Python 3.7.6)" "-"
frontend_1              | 172.19.0.8 - - [24/Jun/2020:10:12:12 +0000] "POST /api/ HTTP/1.1" 200 132 "-" "jsonrpclib/0.4.1 (Python 3.7.6)" "-"
test_text_indexation_1  | .waiting for corpus to start
test_text_indexation_1  | resetting tti_medialab
test_text_indexation_1  | mongo database hyphe_tti_medialab reset
test_text_indexation_1  | elasticsearch index hyphe_tti_medialab deleted
mongo_1                 | 2020-06-24T10:12:12.011+0000 I NETWORK  [conn20] end connection 172.19.0.8:50662 (59 connections now open)
mongo_1                 | 2020-06-24T10:12:12.011+0000 I NETWORK  [conn19] end connection 172.19.0.8:50656 (59 connections now open)
test_text_indexation_1  | .
test_text_indexation_1  | 
test_text_indexation_1  | ======================== 8 passed in 156.84s (0:02:36) =========================
hyphe_test_text_indexation_1 exited with code 0
```

 
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
# don't forget to insall build dependencies if new machine or new to build: https://github.com/pyenv/pyenv/wiki#suggested-build-environment
$ pyenv install 3.7.6
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

# TODO

- refacto de la méthod create_corpus crawl et WECR utilisé deux fois
- d'autres tests : 
    - deux crawls en parallèle
- conf nginx ES hyphe (GET/POST sur search)