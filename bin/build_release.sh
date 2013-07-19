#!/bin/bash

rm -rf build
mkdir -p build/bin build/config build/log build/lucene-data

bash bin/build_thrift.sh

listfiles="LICENSE.txt README.md requirements.txt bin/samples bin/install.sh bin/start_lucene.sh bin/start.sh bin/stop.sh config/config.json.example config/scrapyd.config hyphe_backend hyphe_www_client"

for file in $listfiles; do
  cp -r $file build/$file
done

cd build
rm -rf hyphe_www_client/_config
tar -acf hyphe-release-`date +%Y%m%d-%H%M`.tar.gz *
cd ..

