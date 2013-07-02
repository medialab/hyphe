#!/bin/bash

source /usr/local/bin/virtualenvwrapper.sh
workon HCI
cd hyphe_backend/crawler
python deploy.py

