from elasticsearch import Elasticsearch
import time
import requests


def index_name(c) :
    return "hyphe_%s"%c

def connect_to_es(host, port, timeout):
    # Don't print NewConnectionError's while we're waiting for Elasticsearch
    # to come up.
    print('request to %s:%s...'%(host, port))
    port_opened = False
    while not port_opened:
        try:
            r = requests.get('http://%s:%s'%(host, port))
            port_opened = r.status_code == 200
        except Exception as e:
            print(e)
            print("Exception in requests")
        finally:
            if not port_opened:
                print("ES replied with a bad HTTP code, retry in 1s")
                time.sleep(1)
            else:
                print('Elasticsearch is responding')
    es = Elasticsearch('%s:%s'%(host, port))
    start = time.time()
    for _ in range(0, timeout):
        try:
            es.cluster.health(wait_for_status='yellow')
            print('Elasticsearch took %d seconds to come up.' % (time.time()-start))
            return es
            break
        except ConnectionError:
            print('Elasticsearch not up yet, will try again.')
            time.sleep(1)
    else:
        raise EnvironmentError("Elasticsearch failed to start.")
