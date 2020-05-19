import os
from argparse import ArgumentParser

ELASTICSEARCH_HOST = os.environ.get("HYPHE_ELASTICSEARCH_HOST","localhost")
ELASTICSEARCH_PORT = int(os.environ.get("HYPHE_ELASTICSEARCH_PORT", 9200))
ELASTICSEARCH_TIMEOUT_SEC = int(os.environ.get('HYPHE_ELASTICSEARCH_TIMEOUT_SEC', 30))
MONGO_HOST = os.environ.get("HYPHE_MONGO_HOST","localhost")
MONGO_PORT = int(os.environ.get("HYPHE_MONGO_PORT", 27017))
NB_INDEXATION_WORKERS = int(os.environ.get("HYPHE_TXT_INDEXATION_NB_INDEXATION_WORKERS", 2))
BATCH_SIZE = int(os.environ.get("HYPHE_TXT_INDEXATION_BATCH_SIZE", 10))
UPDATE_WE_FREQ = int(os.environ.get("HYPHE_TXT_INDEXATION_UPDATE_WE_FREQ", 5))



