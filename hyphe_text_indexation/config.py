import os
from argparse import ArgumentParser

ELASTICSEARCH_HOST = os.environ.get("HYPHE_ELASTICSEARCH_HOST","localhost")
ELASTICSEARCH_PORT = int(os.environ.get("HYPHE_ELASTICSEARCH_PORT", 9200))
ELASTICSEARCH_TIMEOUT_SEC = int(os.environ.get('HYPHE_ELASTICSEARCH_TIMEOUT_SEC', 30))
MONGO_HOST = os.environ.get("HYPHE_MONGO_HOST","localhost")
MONGO_PORT = int(os.environ.get("HYPHE_MONGO_PORT", 27017))
NB_INDEXATION_WORKERS = int(os.environ.get("HYPHE_TXT_INDEXATION_NB_INDEXATION_WORKERS", 2))
BATCH_SIZE = int(os.environ.get("HYPHE_TXT_INDEXATION_BATCH_SIZE", 10))
UPDATE_WE_FREQ = int(os.environ.get("UHYPHE_TXT_INDEXATION_PDATE_WE_FREQ", 5))
DELETE_INDEX = os.environ.get("HYPHE_TXT_INDEXATION_DELETE_INDEX", 'false') == 'true'
RESET_MONGO = os.environ.get("HYPHE_TXT_INDEXATION_RESET_MONGO", 'false') == 'true'

parser = ArgumentParser()
parser.add_argument('--batch-size', type=int)
parser.add_argument('--nb-indexation-workers', type=int)
parser.add_argument('--delete-index', action='store_true')
parser.add_argument('--reset-mongo', action='store_true')
args = parser.parse_args()
if args.batch_size:
    BATCH_SIZE = args.batch_size
if args.nb_indexation_workers:
    NB_INDEXATION_WORKERS = args.nb_indexation_workers
if args.delete_index:
    DELETE_INDEX = args.delete_index
if args.reset_mongo:
    RESET_MONGO = args.reset_mongo
