# Hyphe: web corpus curation tool & links crawler

Welcome to [Hyphe](http://hyphe.medialab.sciences-po.fr), a research-driven web crawler developped at the [Sciences Po médialab](http://www.medialab.sciences-po.fr/) for the [DIME-SHS Web project (ANR-10-EQPX-19-01)](http://www.sciencespo.fr/dime-shs/).

Hyphe aims at providing a tool to build web corpus by crawling data from the web and generating networks between what we call "web entities", which can be single pages as well as a website, subdomains or parts of it, or even a combination of those.

## Demo & Tutos

You can try a limited version of Hyphe at the following url: [http://hyphe.medialab.sciences-po.fr/demo/](http://hyphe.medialab.sciences-po.fr/demo/)

You can find extensive tutorials on [Hyphe's Wiki](https://github.com/medialab/hyphe/wiki).

## How to install?

Before running Hyphe, you may want to adjust the settings first. The default config will work but you may want to tune it for your own needs. There is a procedure to change the configuration after the installation. However we recommend to take a look at the [Configuration documentation](doc/config.md) for detailed explanation of each available option.

**Warning:** Hyphe can be quite disk-consuming, a big corpus with a few hundred crawls with a depth 2 can easily take up to 50GB, so if you plan on allowing multiple users, you should ensure at least a few hundreds gigabytes are available on your machine. You can reduce disk-space by setting to false the option `store_crawled_html_content` and limiting the `max_depth` allowed.


### Migrating older versions

Hyphe has changed a lot in the past few years. Migrating from an older version by pulling the code from git is not guaranteed anymore, it is highly recommended to reinstall from scratch. Older corpora can be rebuilt by exporting the list of web entities from the old version and recrawl from that list of urls in the new Hyphe.


### Easy install: using Docker

For an easy install either on Linux, Mac OS X or Windows, the best solution is to rely on [Docker](https://www.docker.com).

Docker enables isolated install and execution of software stacks, which helps installing easily a whole set of dependencies.

Docker's containers are sizeable: you should ensure **at least 4GB** of empty space is available before installing. In any case, as expressed above, for a regular and complete use of Hyphe, you should better ensure at least 100GB are available.

#### 1. Install Docker

First, you should deploy **Docker** on your machine following its [official installation instructions](https://docs.docker.com/install/).

Once you've got Docker installed and running, you will need **Docker Compose** to set up and orchestrate Hyphe services in a single line. Docker Compose is already installed along with Docker on Windows and Mac OS X, but you may need to [install it for Linux](https://docs.docker.com/compose/install/).


#### 2. Download Hyphe

Collect Hyphe's sourcecode from this git repository (recommended way to benefit from future updates) or download and uncompress a [zipped release](https://github.com/medialab/hyphe/releases), then enter the resulting directory:

```bash
git clone https://github.com/medialab/hyphe.git hyphe
cd hyphe
```


#### 3. Configure

Then, copy the default configuration files and edit them to adjust the settings to your needs:

```bash
# use "copy" instead of "cp" under Windows powershell
cp .env.example .env
cp config-backend.env.example config-backend.env
cp config-frontend.env.example config-frontend.env
```

The `.env` file lets you configure:
+ `TAG`: the reference Docker image you want to work with among
  + `prod`: for the latest stable release
  + `preprod`: for intermediate unstable developments
+ `PUBLIC_PORT`: the web port on which Hyphe will be served (usually 80 for a single service server, or for a shared host any other port you like which will need to be redirected)
+ `DATA_PATH`: using Hyphe can quickly consume several gigabytes of hard drive. By default, volumes will be stored within Docker's default directories but you can define your own path here.

  **WARNING:** `DATA_PATH` MUST be either empty, or a full absolute path including leading and trailing slashes (for instance `/var/opt/hyphe/`).

  It is not currently supported under Windows, and should always remain empty in this case (so you should install Hyphe from a drive with enough available space).
+ `RESTART_POLICY`: the choice of autorestart policy you want Hyphe containers to apply
  + `no`: (default) containers will not be restarted automatically under any circumstance
  + `always`: containers will always restart when stopped
  + `on-failure`: containers will restart only if the exit code indicates an on-failure error
  + `unless-stopped`: containers will always restart unless when explicitly stopped

  If you want Hyphe to start automatically at boot, you should use the `always` policy and make sure the Docker daemon is started at boot time with your service manager.

Hyphe's internal settings are adjustable within `config-backend.env` and `config-frontend.env`. Adjust the settings values to your needs following [recommendations from the config documentation](doc/config.md).

If you want to restrict Hyphe's access to a selected few, you should leave `HYPHE_OPEN_CORS_API` false in `config-backend.env`, and setup `HYPHE_HTPASSWORD_USER` & `HYPHE_HTPASSWORD_PASS` in `config-frontend.env` (use `openssl passwd -apr1` to generate your password's encrypted value).


#### 4. Prepare the Docker containers

You have two options: either collect, or build Hyphe's Docker containers.

+ **Recommended: Pull** our official preassembled images from the Docker Store

  ```bash
  docker-compose pull
  ```

+ **Alternative: Build** your own images from the source code (mostly for development or if you intend to edit the code, and for some very specific configuration settings):

  ```bash
  docker-compose build
  ```

Pulling should be faster, but it will still take a few minutes to download or build everything either way.


#### 5. Start Hyphe

Finally, start Hyphe containers with the following command, which will run Hyphe and display all of its logs in the console until stopped by pressing `Ctrl+C`.

```bash
docker-compose up
```

Or run the containers as a background daemon (for instance for production on a server):

```bash
docker-compose up -d
```

Once the logs say "All tests passed. Ready!", you can access your Hyphe install at http://localhost:80/ (or `http://localhost:<PUBLIC_PORT>/` if you changed the port value in the `.env` configuration file).


#### 6. Stop and monitor Hyphe

To stop containers running in background, use `docker-compose stop` (or `docker-compose down` to also clean relying data).

You can inspect the logs of the various Docker containers using `docker-compose logs`, or with option `-f` to track latest entries like with `tail`.

Whenever you change any configuration file, restart the Docker container to take the changes into account:

```bash
docker-compose stop
docker-compose up -d
```

Run `docker-compose help` to get more explanations on any extra advanced use of Docker.

If you encounter issues with the Docker builds, please report an [issue](https://github.com/medialab/hyphe/issues) including the "Image ID" of the Docker images you used from the output of `docker images` or, if you installed from source, the last commit ID (read from `git log`).


#### 7. Update to future versions

If you installed from git by pulling our builds from DockerHub, you should be able to update Hyphe to future minor releases by simply doing the following:

```bash
docker-compose down
git pull
docker-compose pull
# eventually edit your configuration files to use new options
docker-compose up -d
```


### Manual install (complex and only for Linux)

If your computer or server relies on an old Linux distribution unable to run Docker, if you want to contribute to Hyphe's backend development, or for any other personal reason, you might want to rather install Hyphe manually by following the [manual install instructions](doc/install.md).

Please note there are many dependencies which are not always trivial to install and that you might run in quite a bit of issues. You can ask for some help by [opening an issue](https://github.com/medialab/hyphe/issues) and describing your problem, hopefully someone will find some time to try and help you.

Hyphe relies on a web interface with a server daemon which must be running at all times. When manually installed, one must start, stop or restart the daemon using the following command (without `sudo`):

```bash
bin/hyphe <start|restart|stop> [--nologs]
```

By default the starter will display Hyphe's log in the console using `tail`. You can use `Ctrl+C` whenever you like to stop displaying logs without shutting Hyphe down. Use the `--nologs` option to disable logs display on start. Logs are always accessible from the `log` directory.

All settings can be configured directly from the global configuration file `config/config.json`. Restart Hyphe afterwards to take changes into account: `bin/hyphe restart`.


### Serve Hyphe on the web

As soon as the Docker containers or the manual daemon start, you can use Hyphe's web interface on your local machine at the following url:
- Docker install: [http://localhost/](http://localhost/)
- manual install: [http://localhost/hyphe](http://localhost/hyphe).

For personal uses, you can already work with Hyphe as such. Although, if you want to let others use it as well (typically if you installed on a distant server), you need to serve it on a webserver and make a few adjustments.

Read the [dedicated documentation](doc/serve.md) to do so.


## Advanced developers features & contributing

Please read the dedicated [Developers documentation](doc/dev.md) and the [API description](doc/api.md).


## What's next?

See our [roadmap](doc/roadmap.md)!


## Papers & references

### Tutorials / examples

* Explanatory video (french) [Explorer les internets avec Hyphe](https://metsem.hypotheses.org/111) (September 2017). Mathieu Jacomy presents Hyphe at Sciences Po CEVIPOF during METSEM, a seminar on digital methods in social sciences.

* (FR) [Le web du secteur de l'hydrogène](https://www.cellie.fr/2018/11/21/le-graphe-un-pan-de-la-dataviz-exploitable-pour-cartographier-et-explorer-un-secteur-dactivite-2/) par Mathieu Boyer (2018)


### Publications about Hyphe

* JACOMY, Mathieu, GIRARD, Paul, OOGHE-TABANOU, Benjamin, et al, "[Hyphe, a curation-oriented approach to web crawling for the social sciences.](https://spire.sciencespo.fr/hdl:/2441/6obemb2hsj9pboj9bbvc7sftne/resources/jacomy-all-hyphe-icwsm-2016.pdf)", in International AAAI Conference on Web and Social Media. Association for the Advancement of Artificial Intelligence, 2016.

* PLIQUE, Guillaume, JACOMY, Mathieu, OOGHE-TABANOU, Benjamin & GIRARD, Paul, "It's a Tree... It's a Graph... It's a Traph!!!! Designing an on-file multi-level graph index for the Hyphe web crawler". ([Video](https://fosdem.org/2018/schedule/event/multi_level_graph_index/) / [Slides](https://medialab.github.io/hyphe-traph/fosdem2018/)) Presentation at the FOSDEM, Brussels, BELGIUM, February 3rd, 2018.

* OOGHE-TABANOU, Benjamin, JACOMY, Mathieu, GIRARD, Paul & PLIQUE, Guillaume, "Hyperlink is not dead!" ([Proceeding](http://hyphe.medialab.sciences-po.fr/docs/20181004-ACM-WebStudies-HyperlinkIsNotDead.pdf) / [Slides](http://hyphe.medialab.sciences-po.fr/docs/20181004-DigitalTools-HyperlinkIsNotDead.pdf)), In Proceedings of the 2nd International Conference on Web Studies (WS.2 2018), Everardo Reyes, Mark Bernstein, Giancarlo Ruffo, and Imad Saleh (Eds.). ACM, New York, NY, USA, 12-18. DOI: https://doi.org/10.1145/3240431.3240434 


### Publications using Hyphe

* TOURNAY Virginie, JACOMY Mathieu, NECULA Andra, LEIBING Annette & BLASIMME Alessandro, 2019, "[A New Web-Based Big Data Analytics for Dynamic Public Opinion Mapping in Digital Networks on Contested Biotechnology Fields](https://www.liebertpub.com/doi/10.1089/omi.2019.0130)", in OMICS: A Journal of Integrative Biology. DOI: 10.1089/omi.2019.0130

* ÁLVARO SÁNCHEZ, Sandra, 2019, "[A Topological Space for Design, Participation and Production. Tracking Spaces of Transformation](http://peerproduction.net/editsuite/issues/issue-13-open/peer-reviewed-papers/a-topological-space-for-design-participation-and-production/)", in Journal of Peer Production, Issue 13: OPEN.

* VENTURINI, Tommaso, JACOMY, Mathieu, BOUNEGRU, Liliana & GRAY, Jonathan, (2018, forthcoming), "[Visual Network Exploration for Data Journalists](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3043912)", in S. E. I. and B. Franklin (Ed.). Abingdon: Routledge.

* FROIO, Caterina, "[Nous et les autres. L’altérité sur les sites web des extrêmes droites en France](http://www.cairn.info/article.php?ID_ARTICLE=RES_202_0039&WT.mc_id=RES_202)", in Réseaux, 2017/2 (n° 202-203), p. 39-78. DOI: 10.3917/res.202.0039.

* FROIO, Caterina, "[Race, Religion, or Culture? Framing Islam between Racism and Neo-Racism in the Online Network of the French Far Right](https://www.cambridge.org/core/journals/perspectives-on-politics/article/race-religion-or-culture-framing-islam-between-racism-and-neoracism-in-the-online-network-of-the-french-far-right/FE258FCC20A9AAFFF2390E942426D491)", in Perspectives on Politics, 16(3) (n° 202-203), p. 696-709, 2018. DOI: 10.1017/S1537592718001573.

* DESFRICHES-DORIA, Orélie, SERGENT, Henri, TRAN, Félicia, HAETTICH, Yoann & BOREL, Justine (2018), "[What is Digital Humanities' identity in interdisciplinary practices?: An experiment with digital tools for visualizing the francophone DH network](https://dl.acm.org/citation.cfm?doid=3240431.3240439), In Proceedings of the 2nd International Conference on Web Studies (WS.2 2018), Everardo Reyes, Mark Bernstein, Giancarlo Ruffo, and Imad Saleh (Eds.). ACM, New York, NY, USA, 39-47. DOI: https://doi.org/10.1145/3240431.3240439

* ARZHEIMER, Kai, "[The AfD’s Facebook Wall: A new Hub for Right-Wing Mobilisation in Germany?](http://www.kai-arzheimer.com/my-apsa-2015-paper-the-afds-facebook-wall-as-a-hub-for-right-wing-mobilisation-in-germany/)", in [American Political Science Association Conference, 2015](https://convention2.allacademic.com/one/apsa/apsa15/index.php?cmd=Online+Program+View+Paper&selected_paper_id=997634&PHPSESSID=vnpdminlo8d0kvs0u7aprbk8e0).

* PEDROJA, Cynthia, et al. "[Dépasser la liste : quand la bibliothèque entre dans la danse des corpus web.](https://hal.archives-ouvertes.fr/hal-01386536/document)" Digital Humanities 2016 (DH2016). Jagiellonian University & Pedagogical University, 2016.

* DE CARVALHO PEREIRA, Débora "[Les réseaux d'influence sur le web dans le domaine des produits laitiers](https://f.hypotheses.org/wp-content/blogs.dir/3105/files/2017/10/Rapport-REPASTOL-PEREIRA-2017.compressed.pdf)".

* OJALA, Mace "[Mining with Hyphe](https://ethos.itu.dk/2017/01/05/mining-with-hyphe-reflections-on-publicethos-13/)", 2018 (a blog post on Ethos Lab's blog)

* CREPEL, Maxime, BOULLIER, Dominique, JACOMY, Mathieu, OOGHE-TABANOU, Benjamin, ANTOLINOS-BASSO, Diego, MONSALLIER, Paul  "[Privacy web corpus](http://tools.medialab.sciences-po.fr/privacy/)", 2017.

* CAYLA, Nathalie, PEYRACHE-GADEAU, Véronique, [La singularité territoriale générée par le déploiement de la marque Parc naturel régional](https://labexitem.hypotheses.org/452), 2017

* ROGERS, Richard. [Digital Methods for Cross-platform Analysis](https://www.researchgate.net/profile/Richard_Rogers13/publication/314100273_Digital_Methods_for_Cross-platform_Analysis/links/58b57ae392851ca13e52cb50/Digital-Methods-for-Cross-platform-Analysis.pdf). J. Burgess, A. Marwick e T. Poell (a cura di) The Sage Handbook of Social Media. London: Sage, 2017.

* SERRES, Alexandre et STALDER, Angèle. [L'EMI sur le web: cartographie d'un domaine en émergence](https://archivesic.ccsd.cnrs.fr/sic_01483421/document). In: Journée d'étude GRCDI-ESPE de Caen et Rouen,«L’EMI en questions: enjeux, prescriptions, contenus, apprentissages». 2016.

* BERTHELOT, Marie-Aimée, SEVERO, Marta, et KERGOSIEN, Eric. [Cartographier les acteurs d'un territoire: une approche appliquée au patrimoine industriel textile du Nord-Pas-de-Calais](https://hal.archives-ouvertes.fr/hal-01353660/document). In: CIST2016-En quête de territoire (s)?. 2016. p. 66-72.

* SCHNEIDER, Élisabeth, SERRES, Alexandre, et STALDER, Angèle. [L’EMI en partage: essai de cartographie des acteurs](https://archivesic.ccsd.cnrs.fr/sic_01217549/document). In: 10e Congrès des Enseignants Documentalistes de l'Education Nationale" Enseigner-apprendre l'information-documentation". 2015.

* KERGOSIEN, Eric, JACQUEMIN, Bernard, SEVERO, Marta, et al. [Vers l'interopérabilité des données hétérogènes liées au patrimoine industriel textile](https://hal.univ-lille3.fr/hal-01281716v2/document). In: CiDE. 18. 18e Colloque international sur le Document Électronique. Europia, 2015. p. 145-158.

* MUNK, Anders Kristian. [Mapping Wind Energy Controversies Online: Introduction to Methods and Datasets](http://www.academia.edu/11976139/Mapping_Wind_Energy_Controversies_Online_Introduction_to_Methods_and_Datasets). 2014.

* WARD, Jeremy, CAFIERO, Florian, FRETIGNY, Raphael, COLGROVE, James & SEROR, Valérie. [France's citizen consultation on vaccination and the challenges of participatory democracy in health](https://www.sciencedirect.com/science/article/pii/S0277953618306282). Social Science & Medicine. 220. 10.1016/j.socscimed.2018.10.032. 2018. DOI: https://doi.org/10.1016/j.socscimed.2018.10.032

* ROMELE, Alberto, SEVERO Marta. [From Philosopher to Network. Using Digital Traces for Understanding
Paul Ricoeur’s Legacy](https://hal.archives-ouvertes.fr/hal-01294443/document). Azimuth. Philosophical Coordinates in Modern and Contemporary Age, Edizioni Storia e Letteratura, 2016, Philosophy and Digital Traces, VI (6), <azimuthjournal.com> <hal-01294443>


## Credits & License

[Mathieu Jacomy](https://github.com/jacomyma), [Benjamin Ooghe-Tabanou](https://github.com/boogheta) & [Guillaume Plique](https://github.com/Yomguithereal) @ [Sciences Po médialab](https://github.com/medialab)

Discover more of our projects at [médialab tools](http://tools.medialab.sciences-po.fr/).

This work is supported by [DIME-Web](http://dimeweb.dime-shs.sciences-po.fr/), part of [DIME-SHS](http://www.sciencespo.fr/dime-shs/) research equipment financed by the EQUIPEX program (ANR-10-EQPX-19-01).

Hyphe is a free open source software released under [AGPL 3.0 license](LICENSE).

<blockquote>
<i>[...] I hear _kainos_ [(greek: "now")] in the sense of thick, ongoing presence, with __hyphae__ infusing all sorts of temporalities and materialities."</i>

Donna J. Haraway, Staying with the Trouble, Making kin with the Chthlucene p.2
</blockquote>
