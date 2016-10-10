#!/bin/bash

corpus=

cd outputs
for dir in html text textArticle textArticleSentences textCanola textDefault; do
  mkdir -p $dir
  for we in `ls $corpus/`; do
    touch $dir/$we.txt
    ls $corpus/$we/$dir | while read f; do
      cat $outputs/$we/$dir/$f >> $dir/$we.txt
    done
  done
  tar -czvf $dir.tar.gz $dir
done
