#!/bin/bash

version=$1
if test -z "$version"; then
  version=$(date +%Y%m%d-%H%M)
fi

rm -rf build
mkdir -p build/Hyphe/bin build/Hyphe/config build/Hyphe/log build/Hyphe/lucene-data

bash bin/build_thrift.sh

listfiles="LICENSE.* README.md COPYING requirements.txt bin/samples bin/deploy_scrapy_spider.sh bin/build_thrift.sh bin/install.sh bin/install_thrift.sh bin/hyphe.example config/config.json.example config/scrapyd.config hyphe_backend hyphe_www_client"

for file in $listfiles; do
  cp -r $file build/Hyphe/$file
done

cd build
rm -rf Hyphe/hyphe_www_client/_config
tar -acf hyphe-release-$version.tar.gz Hyphe
cd ..

