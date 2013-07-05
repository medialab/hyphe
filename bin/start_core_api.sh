#!/bin/bash

source /usr/local/bin/virtualenvwrapper.sh
workon HCI
twistd -noy hyphe_backend/core.tac -l -

