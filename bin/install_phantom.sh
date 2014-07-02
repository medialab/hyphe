#!/bin/bash

wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-x86_64.tar.bz2 -O phantomjs-1.9.7-linux-x86_64.tar.bz2
bunzip2 phantomjs-1.9.7-linux-x86_64.tar.bz2
tar -xvf phantomjs-1.9.7-linux-x86_64.tar
mv phantomjs-1.9.7-linux-x86_64/bin/phantomjs bin/hyphe-phantomjs-1.9.7
rm -rf phantomjs-1.9.7-linux-x86_64*

