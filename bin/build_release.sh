#!/bin/bash

# Define version date or number as argument
version=$1
if test -z "$version"; then
  version=$(date +%Y%m%d-%H%M)
fi

source bin/common.sh

bash bin/build_apidoc.sh

echo "Building Java Thrift Interface for backend..."
bash bin/build_thrift.sh > /tmp/hyphe.build_thrift.log || exitAndLog /tmp/hyphe.build_thrift.log "building:"

#echo "Install node dependencies for frontend..."
#cd hyphe_frontend
#bower install > /tmp/hyphe.install_bower.log || exitAndLog /tmp/hyphe.install_bower.log "installing"
#cd ..

echo "Cleanup and prepare build directory..."
rm -rf build
mkdir -p build/hyphe/bin build/hyphe/config build/hyphe/log build/hyphe/lucene-data

echo "Copy all required release files..."
listfiles="LICENSE.*
README.md
COPYING
requirements.txt
bin/samples
bin/common.sh
bin/install.sh
bin/hyphe
bin/hyphe-phantomjs-2.0.0
bin/deploy_scrapy_spider.sh
config/apache2_example.conf
config/config.json.example
config/scrapyd.config
doc
hyphe_backend
hyphe_frontend"
for file in $listfiles; do
  cp -r $file build/hyphe/$file
done
rm -rf build/hyphe/hyphe_frontend/app/bower_components
rm -f build/hyphe/hyphe_frontend/app/dev.html

echo "Create release archive..."
cd build
tar -acf hyphe-release-$version.tar.gz hyphe
cd ..

echo "All done! Release available in build/hyphe-release-$version.tar.gz"
