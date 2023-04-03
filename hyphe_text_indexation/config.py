import os
from argparse import ArgumentParser
from ast import literal_eval

ELASTICSEARCH_HOST = os.environ.get("HYPHE_ELASTICSEARCH_HOST","localhost")
ELASTICSEARCH_PORT = int(os.environ.get("HYPHE_ELASTICSEARCH_PORT", 9200))
ELASTICSEARCH_TIMEOUT_SEC = int(os.environ.get('HYPHE_ELASTICSEARCH_TIMEOUT_SEC', 60))
MONGO_HOST = os.environ.get("HYPHE_MONGO_HOST","127.0.0.1")
MONGO_PORT = int(os.environ.get("HYPHE_MONGO_PORT", 27017))
NB_INDEXATION_WORKERS = int(os.environ.get("HYPHE_TXT_INDEXATION_NB_INDEXATION_WORKERS", 4))
BATCH_SIZE = int(os.environ.get("HYPHE_TXT_INDEXATION_BATCH_SIZE", 1000))
UPDATE_WE_FREQ = int(os.environ.get("HYPHE_TXT_INDEXATION_UPDATE_WE_FREQ", 5))


EXTRACTION_METHODS =  literal_eval(os.environ.get("HYPHE_TXT_INDEXATION_EXTRACTION_METHODS","['textify', 'trafilatura']"))
DEFAULT_EXTRACTION_METHOD = os.environ.get("HYPHE_TXT_INDEXATION_DEFAULT_EXTRACTION_METHOD", 'textify')

