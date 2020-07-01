# Hyphe Text Indexation Tests

Functionnal testing of the text indecation process for Hyphe.
Those tests require crawling the web, it's a rather longer process than usual tests.

## How to run tests

### inside docker

```bash 
docker-compose -f docker-compose.yml -f docker-compose-text_indexation.yml -f docker-compose-test_text_indexation.yml up
docker logs -f hyphe_test_text_indexation_1
```

After something like 2 minutes of a long log oh Hyphe working on the tests you should see the test result: 
```bash
test_text_indexation_1  | ======================== 8 passed in 156.84s (0:02:36) =========================
hyphe_test_text_indexation_1 exited with code 0
```

 
### outside docker

First you need to launch a text indexation version of Hyphe with docker (or without if you really want troubles)
```bash
$ cd hyphe
$ docker-compose -f docker-compose.yml -f docker-compose-text_indexation.yml up
```

Wait for all services to be up.
You can monitor the text indexation process log like this :
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

Beware those tests are functional forms a test scenario. Most tests are therefore dependent from the results of the previous one. They mostly need to be executed in the declaration order.

- create a test corpus, remove it if exists
- crawl medialab website from statpages depth 0
- add Webentity creation rule on equipe
- test updates are waiting while crawl run
- once crawl finished, wait for updates to be processed
- compare number of pages in index and in traph by web entity
- create one web entity as child and check number of pages in parent and new child
- merge one web entity in parent
- test if web entity disapear from index & number of pages of parent web entity
- test query ouestware
- test extraction methods
- test reset script
- test multicorpus adding IETF
- test cleaning test corpus destroy indices