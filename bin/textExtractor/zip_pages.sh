#!/bin/bash

corpus=$1
method=$2

if [ -z "$corpus" ]; then
  echo "Please give the corpus id"
  exit(1)
fi

if [ -z "$method" ]; then
  method=textCanola
fi

cd outputs

mkdir -p $method-pages-$corpus

ls $corpus          |
 grep -v "done.txt" |
 while read wid; do
  if [ -e $corpus/$wid/$method]; then
    echo $wid
    mkdir $method-pages-$corpus/$wid
    ls $corpus/$wid/$method/ |
     while read pid; do
      if [ -s $corpus/$wid/$method/$pid ]; then
        cp $corpus/$wid/$method/$pid $method-pages-$corpus/$wid/$pid.txt
      fi
    done
  fi
done
tar -czvf $method-pages$corpus.tar.gz $method-pages-$corpus

