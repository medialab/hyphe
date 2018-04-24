#!/bin/bash

oldcorpus=$1
newcorpus=$2
newname=$3

# Check config and grab useful settings
if [ ! -s "config/config.json" ]; then
  echo "ERROR: you must run this script from the root directory where Hyphe is installed"
  exit 1
fi
hyphedb=$(grep "\(db_name\|project\)['\"]" config/config.json | sed -r "s/^.*: *(['\"])(.*)\1[, ]*$/\2/")
traphdir=$(grep "data_path['\"]" config/config.json | sed -r "s/^.*: *(['\"])(.*)\1[, ]*$/\2/")
mongodir=$(grep -i "^\s*dbpath[=:]" /etc/mongod*.conf | sed -r "s/^.*[=:] *(\/.*) *$/\1/")

# Check oldcorpus exists
if [ -z "$oldcorpus" ]; then
  echo "USAGE: bash bin/clone_corpus.sh OLDCORPUSID [NEWCORPUSID [NEWCORPUSNAME]]"
  exit 1
fi
oldname=$(mongo "$hyphedb" --eval "db.corpus.find({_id: \"$oldcorpus\"}).forEach(printjson)" | grep '"name"' | sed -r 's/^.*: *"(.*)",$/\1/')
if [ -z "$oldname" ]; then
  echo "ERROR: cannot find corpus with ID \"$oldcorpus\" in Hyphe's corpus MondoDB ($hyphedb)."
  exit 1
fi

# Define newcorpus ID & name
if [ -z "$newcorpus" ]; then
  echo "WARNING: no new ID given for clone corpus of \"$oldcorpus\"."
  newcorpus="$oldcorpus"_$(date +%y%m%d%H%M)
  echo "will use automatically generated corpus ID: \"$newcorpus\"."
  echo "Press Enter to proceed or Ctrl+c to cancel and give your choice of new corpus ID."
  echo "USAGE: bash bin/clone_corpus.sh OLDCORPUSID [NEWCORPUSID [NEWCORPUSNAME]]"
  read
fi
if [ -z "$newname" ]; then
  echo "WARNING: no new name given for clone corpus of \"$oldname\"."
  newname="$oldname copy-"$(date +%Y/%m/%d-%H:%M)
  echo "will use automatically generated corpus name: \"$newname\"."
  echo "Press Enter to proceed or Ctrl+c to cancel and give your choice of new corpus name."
  echo "USAGE: bash bin/clone_corpus.sh OLDCORPUSID [NEWCORPUSID [NEWCORPUSNAME]]"
  read
fi

# Check newcorpus does not already exist in mongo and traph
if [ $(mongo "$hyphedb" --eval "db.corpus.count({_id: \"$newcorpus\"})" | grep '^[0-9]') -ne "0" ]; then
  echo "ERROR: there is already a corpus with ID \"$newcorpus\" in Hyphe's corpus MongoDB ($hyphedb)."
  exit 1
fi
if [ -d "$traphdir/$newcorpus" ]; then
  echo "ERROR: there is already a Traph directory for a corpus with ID \"$newcorpus\" in \"$traphdir\"."
  exit 1
fi

# Check disk space and required
function freespace { df --total "$1/" | tail -1 | awk '{print $4}'; }
function usedspace { du -s "$1/" | awk '{print $1}'; }
mongofreespace=$(freespace "$mongodir")
mongousedspace=$(mongo "$hyphedb" --eval "(db['$oldcorpus.jobs'].totalSize() + db['$oldcorpus.logs'].totalSize() + db['$oldcorpus.pages'].totalSize() + db['$oldcorpus.queries'].totalSize() + db['$oldcorpus.queue'].totalSize() + db['$oldcorpus.stats'].totalSize())/1024" | grep '^[0-9]' | awk -F '.' '{print $1}')
traphfreespace=$(freespace "$traphdir")
traphusedspace=$(usedspace "$traphdir/$oldcorpus")
minrequired=$((($mongousedspace + $traphusedspace) * 3 / 2))
minwarning=$((($mongousedspace + $traphusedspace) * 2))
spacereport="this corpus already takes ${mongousedspace}K of mongo data and ${traphusedspace}K of traph data"
if [ $minrequired -gt $mongofreespace ]; then
  echo "ERROR: $spacereport"
  echo "There is not enough space left on the disk where MongoDB data is stored, see $mongodir"
  df -h $mongodir
  exit 1
elif [ $minrequired -gt $traphfreespace ]; then
  echo "ERROR: $spacereport"
  echo "There is not enough space left on the disk where Traph data is stored, see $traphdir"
  df -h $traphdir
  exit 1
elif [ $minwarning -gt $mongofreespace ]; then
  echo "WARNING: $spacereport"
  echo "There is not much space left on the disk where MongoDB data is stored, see $mongodir"
  df -h $mongodir
  echo "Press Enter to proceed or Ctrl+c to cancel and cleanup some space first."
  read
elif [ $minwarning -gt $traphfreespace ]; then
  echo "WARNING: $spacereport"
  echo "There is not much space left on the disk where Traph data is stored, see $traphdir"
  df -h $traphdir
  echo "Press Enter to proceed or Ctrl+c to cancel and cleanup some space first."
  read
fi

# Stop Hyphe
echo "Stopping Hyphe..."
if ! bin/hyphe stop --nologs; then
  echo "ERROR: could not stop Hyphe"
  exit 1
fi

# copy corpus entry in Hyphe's MongoDB  
echo "Create corpus metas in MongoDB"
mongo $hyphedb --eval "db.corpus.find({_id: '$oldcorpus'}).forEach( function(x){ x._id = '$newcorpus'; x.name = '$newname'; db.corpus.insert(x); } );"

# Create mongo collections for new corpus
echo "Copy collections in MongoDB..."
for coll in creationrules jobs logs pages queries queue stats webentities; do
  echo " - $coll"
  mongoexport -d "${hyphedb}_${oldcorpus}" -c "$coll" | mongoimport -d "${hyphedb}_${newcorpus}" -c "$coll" --drop
done

# Copy Traph data
echo "Copy traph data..."
cp -r "$traphdir/$oldcorpus" "$traphdir/$newcorpus"

# Restart Hyphe
echo "Corpus $oldcorpus successfully cloned into $newcorpus"
echo "Restarting Hyphe now..."
bin/hyphe start --nologs
sleep 10

# Deploy new crawler
./hyphe_backend/test_client.py start_corpus "$newcorpus"
sleep 10
./hyphe_backend/test_client.py crawl.deploy_crawler "$newcorpus"

