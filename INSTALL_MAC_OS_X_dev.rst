= Installation de pip =
easy_install pip

= Installation de Virtual Env et du Wrapper =
sudo pip install virtualenv
sudo pip install virtualenvwrapper

cd ~
mkdir .virtualenv
vi .profile

Ajouter les éléments suivants dans le .profile

# Python Virtual Env
export WORKON_HOME=$HOME/.virtualenv
source /usr/local/bin/virtualenvwrapper.sh
export PIP_VIRTUALENV_BASE=$WORKON_HOME
export PIP_RESPECT_VIRTUALENV=true
alias v=workon
alias v.deactivate=deactivate
alias v.mk='mkvirtualenv --no-site-packages'
alias v.mk_withsitepackages='mkvirtualenv'
alias v.rm=rmvirtualenv
alias v.switch=workon
alias v.add2virtualenv=add2virtualenv
alias v.cdsitepackages=cdsitepackages
alias v.cd=cdvirtualenv
alias v.lssitepackages=lssitepackages


Commandes utiles de Virtual Env :

v.mk ENV : création de l'environnement ENV
v.deactivate ENV : quitter l'environnement actuel
v ENV : aller dans l'environnement ENV
v.rm ENV : suppression de l'environnement ENV

Configuration du virtualenv d'HCI:
v.mk HCI
v HCI


= Installer autoconf =
brew install autoconf


= Installation de thrift =
brew install thrift


= Installation des dépendances python =

Utiliser :
pip install -r requirements.txt

Dans le détail :
pip install twisted
pip install simplejson
pip install networkx
pip install txJSON-RPC
pip install pymongo
pip install thrift
pip install pystache


= Installation de Scrapy =
http://scrapy.readthedocs.org/en/latest/topics/scrapyd.html?highlight=scrapyd

pip install Scrapy

scrapy server
twistd -ny extras/scrapyd.tac

http://localhost:6800/


= Installation de MongoDB =
brew update
brew install mongodb

Pour installation sur Ubuntu, voir la doc de AIME/biblio_data/install.md
https://github.com/medialab/aime/blob/master/biblio_data/install.md


Tester avec la commande :
mongod

Le répertoire /data/db n'existant pas, mangod se quitte.

Créer un répertoire et le fournir au démarrage de mangodb:
/data/db
mongod --dbpath /Users/jrault/Documents/SciencesPo/Projets/HCI/MongoData/db

Le serveur devrait fonctionner sur le port 27017.



= Activer PHP dans le Apache natif =
http://coolestguyplanettech.com/downtown/install-and-configure-apache-mysql-php-and-phpmyadmin-osx-108-mountain-lion

sudo nano /etc/apache2/httpd.conf
Décommenter la ligne :
LoadModule php5_module libexec/apache2/libphp5.so

Créer le fichier php.ini :
sudo cp /etc/php.ini.default /etc/php.ini

Modifier le fichier php.ini :
error_reporting = E_ALL | E_STRICT
display_errors = On
html_errors = On
extension_dir = "/usr/lib/php/extensions/no-debug-non-zts-20090626"

Relancer apache :
sudo apachectl restart

Vérification:
php --ini



= Installer PEAR =
sudo /usr/bin/php /usr/lib/php/install-pear-nozlib.phar

Modifier le fichier php.ini:
Remplacer :
;include_path = ".:/php/includes"
Par :
include_path = ".:/usr/lib/php/pear"

sudo pear channel-update pear.php.net
sudo pecl channel-update pecl.php.net
sudo pear upgrade-all


Config:
pear config-set php_ini /etc/php.ini
pecl config-set php_ini /etc/php.ini


Vérification:
pear version



= Installer Rock MongoDB =
Doc :
http://code.google.com/p/rock-php/wiki/rock_mongo

Installation de l'extension php php_mongo :
sudo pecl install mongo

Télécharger RockMongo et le décompresser dans le répertoire root d'apache : /Library/WebServer/Documents

Modifier le fichier config.php



= Récupération du code source d'HCI =
Site GitHib :
https://github.com/medialab/Hypertext-Corpus-Initiative

git config --global user.name "jrault"
git config --global user.email "julien.rault@sciences-po.fr"

Récupération du code :
git clone git@github.com:medialab/Hypertext-Corpus-Initiative.git

Récupération du Wiki :
git clone git@github.com:medialab/Hypertext-Corpus-Initiative.wiki.git


= Création d'un HCI_HOME =
Pour simplifier l'accès au projet, ajouter dans le .profile de votre un export :
export HCI_HOME=/Users/jrault/Documents/SciencesPo/Projets/HCI/Hypertext-Corpus-Initiative



= Compilation d'HCI =
v HCI
cd $HCI_HOME
bin/build_thrift.sh



= Installation scrapy =
cd crawler
python deploy.py



= Tester =
Avant toute chose :
v HCI
cd $HCI_HOME


== Terminal MongoDB ==
mongod --dbpath /Users/jrault/Documents/SciencesPo/Projets/HCI/MongoData/db

Test RockMongo : http://localhost/rockmongo/
Login : admin
Password : admin


== Terminal Scrapy ==
cd crawler/
scrapy server

Test : http://localhost:6800/


== Terminal de test de Scrapy ==
http://doc.scrapy.org/en/latest/topics/scrapyd.html#json-api-reference

curl http://localhost:6800/schedule.json -d project=hci -d spider=pages

curl http://localhost:6800/listjobs.json -d project=hci -d spider=pages
curl http://localhost:6800/listjobs.json -d project=hci
curl http://localhost:6800/listjobs.json


== Terminal MemoryStructure ==
bin/start_lucene.sh  1


== Terminal Core ==
cd core/
twistd -noy server.py -l -


== Terminal de test du Core ==
cd core/

Commencer les commandes par :
./test_client.py


=== Core ===

* ping

* reinitialize
Reinitializes both the crawling jobs database, scrapy calls and the content of the memory structure.

* declare_page 
* declare_pages array (list of url separated by space)

* crawl_webentity <webentity_id> depth (0 for example)
Starts crawling a webentity with WE_id

* listjobs
Returns the list of crawling jobs asked with statuses info and metainfo

* refreshjobs
Internal function ran in a loop to update statuses. Returns same result as listjobs after running updates


== System ==

* system.listMethods
List these functions

* system.methodHelp <method>
Supposedly gives documentation of a method (TBD)

* system.methodSignature <method>
Supposedly gives signature of a method (TBD)


== Store ==

* store.reinitialize
Reinitializes the content of the Memory Structure

* store.get_webentities
Lists all the webentities in the Memory Structure with their LRU prefixes sets and number of pages

* store.get_webentity_pages <webentity_id>
Lists all the pages within a webentity WE_id

* store.rename_webentity <webentity_id> <new_name>
Renames a webentity WE_id with new_name

* store.setalias <old_webentity_id> <gd_webentity_id>
TBD

* store.get_webentities_network
Generates a GEXF file test_welinks.gexf in lrrr:/home/boo/HCI/core/ with the graph network of the webentities.


== Crawl (Scrapy) ==

* crawl.reinitialize
Reinitializes the crawling jobs database and cancels all current scrapy crawl programmed or ran

* crawl.list
Returns the list of the current scrapy jobs planned, executed or running

* crawl.start <starts> <follow_prefixes> <nofollow_prefixes> <discover_prefixes>
[<maxdepth>=config['scrapyd']['maxdepth']] [<download_delay>=config['scrapyd']['download_delay']]
Crawl from urls given in starts using lru prefixes for follow, nofollow and discover.
Maxdepth and download_delay will be set by default to 1 and 0.5
Multiple ones can be given in each url/lru set by separating them with ","

* crawl.starturls <starts> <follow_prefixes> <nofollow_prefixes> <discover_prefixes>
[<maxdepth>=config['scrapyd']['maxdepth']] [<download_delay>=config['scrapyd']['download_delay']]
Same as crawl.start but takes real urls including for prefixes

* crawl.cancel <job_id>


= Pour déclarer et crawler une liste d'URLs =

cat ../../Test/FILE_LIST_URLS.txt | while read url; do
  ./test_client.py declare_page $url;
done ;
./test_client.py store.get_webentities | grep "u'id'" | sed "s/^.*u'id': u'//" | sed "s/',//" | while read l; do
   ./test_client.py crawl_webentity $l 2;
done
