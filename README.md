# Hyphe: web corpus builder & links crawler

Welcome to Hyphe: developped by [SciencesPo's médialab](http://www.medialab.sciences-po.fr/) for the [DIME-SHS Web project (Equipex)](http://www.sciencespo.fr/dime-shs/).

Hyphe aims at providing a tool to crawl data from the web to generate networks between what we call WebEntities, which can be single pages as well as a website or a combination of such.

## Demo

You can try a restricted version of Hyphe at the following url: [http://hyphe.medialab.sciences-po.fr/demo/](http://hyphe.medialab.sciences-po.fr/demo/)

## Papers and references

### Papers about Hyphe

* JACOMY, Mathieu, GIRARD, Paul, OOGHE, Benjamin, et al. [Hyphe, a curation-oriented approach to web crawling for the social sciences.](http://www.aaai.org/ocs/index.php/ICWSM/ICWSM16/paper/view/13051/12797) In : International AAAI Conference on Web and Social Media. Association for the Advancement of Artificial Intelligence, 2016.

### Papers using Hyphe

* Venturini, T., Jacomy, M., Bounegru, L., & Gray, J. (2018, forthcoming). [Visual Network Exploration for Data Journalists](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3043912). In S. E. I. and B. Franklin (Ed.). Abingdon: Routledge.

* Froio Caterina, "[Nous et les autres. L’altérité sur les sites web des extrêmes droites en France](http://www.cairn.info/article.php?ID_ARTICLE=RES_202_0039&WT.mc_id=RES_202)", Réseaux, 2017/2 (n° 202-203), p. 39-78. DOI : 10.3917/res.202.0039.

* [The AfD’s Facebook Wall as a Hub for Right-Wing Mobilisation in Germany](http://www.kai-arzheimer.com/my-apsa-2015-paper-the-afds-facebook-wall-as-a-hub-for-right-wing-mobilisation-in-germany/)

* Pedroja, Cynthia, et al. "[Dépasser la liste : quand la bibliothèque entre dans la danse des corpus web.](https://hal.archives-ouvertes.fr/hal-01386536/document)" Digital Humanities 2016 (DH2016). Jagiellonian University & Pedagogical University, 2016.

* de Carvalho Pereira, Débora "[Produits laitiers : les réseaux d'influence sur le web](https://f.hypotheses.org/wp-content/blogs.dir/3105/files/2017/10/Rapport-REPASTOL-PEREIRA-2017.compressed.pdf)"


## Easy start

__DISCLAIMER:__ Hyphe has changed a lot between version `0.1` and `0.2`. Migrating from an older version by pulling the code from git was guaranteed as best as possible, although it is highly recommended to reinstall from scratch. Older corpora can be reran by exporting the list of WebEntities from the old version and recrawl from that list of urls in the new version.


### Install a release

For an easy install, the best solution is to download directly the [release version](https://github.com/medialab/Hypertext-Corpus-Initiative/releases), which was built to run against various GNU/Linux distributions (Ubuntu, Debian, CentOS...).

MacOS users and other distribution can now also run Hyphe locally on their machine using [Docker](https://www.docker.com) thanks to @oncletom's work. [See the dedicated section below](#docker-setup).

Just uncompress the release archive, go into the directory and run the installation script.

Do __not__ use `sudo`: the script will do so on its own and will ask for your password only once. This works so in order to install all missing dependencies at once, including mainly Python (python-dev, pip, virtualEnv, virtualEnvWrapper...), Apache2, MongoDB & ScrapyD.

If you are not comfortable with this, you can read the script and run the steps line by line or follow the [Advanced install instructions](doc/install.md) for more control on what is actually installed.

```bash
# WARNING: DO NOT prefix any of these commands with sudo!
tar xzvf hyphe-release-*.tar.gz
cd Hyphe
./bin/install.sh
```

To install from git sources of if you want to contribute to Hyphe's development, please follow the [Advanced install documentation](doc/install.md).


### Configure Hyphe

Before starting Hyphe, you should probably adjust the settings first. Everything you need to change is in the global configuration file ```config/config.json```.

Please read the [Configuration documentation](doc/config.md) for details.


### Run Hyphe

Hyphe relies on a web interface communicating with a server daemon which must be running at all times.
To start, stop or restart the daemon, run (again, __no__ `sudo`):

```bash
bin/hyphe <start|restart|stop> [--nologs]
```

By default the starter will display Hyphe's log in the console using ```tail```. You can ```Ctrl-C``` whenever you want without shutting it off. Use the ```--nologs``` option to disable this.

You can always check the logs for both the core backend and each corpus' MemoryStructure in the ```log``` directory:

```bash
tail -f log/hyphe-*.log
```

As soon as the daemon is started, you can start playing with the web interface on your local machine at the following url: [http://localhost/hyphe](http://localhost/hyphe).


### Serve on the web

Using the website on localhost, you can already use Hyphe. Although, if you want to let others use it as well (typically if you installed on a distant server), you need to make a few adjustments to the Apache configuration.

Please read the dedicated [WebService documentation](doc/serve.md) to do so.

## Docker setup

Docker enables isolated install and execution of software stacks, which can be an easy way to install Hyphe locally on an individual computer, including on unsupported distributions like MacOS.
Follow [Docker install instructions](https://docs.docker.com/installation/) to install Docker on your machine.

[Install Docker Compose](https://docs.docker.com/compose/install/) to set up and orchestrate Hyphe services in a single line.

```bash
docker-compose up
```

When using [boot2docker](http://boot2docker.io/) for instance on MacOS, you might need beforehand to run the following:
```bash
boot2docker up
# and copy paste the 3 lines starting with export to set the environment variables
```

It will take a couple of minutes to spin everything up for the first time.
Once the services are ready, you can access the frontend interface by connecting on its IP address:

```bash
open http://$(docker inspect -f '{{.NetworkSettings.IPAddress}}' hyphe_frontend_1):8000
```

Or, if you use boot2docker:

```bash
open http://$(boot2docker ip):8000
```

**Notice**: this is not a production setup. Get some inspiration from the `docker-compose.yml` to understand how to distribute the application on one or many machines.


## Advanced developers features & contributing

Please read the dedicated [Developers documentation](doc/dev.md) and the [API description](doc/api.md).


## What's next?

See our [roadmap](doc/roadmap.md)!


## Authors

[Mathieu Jacomy](https://github.com/jacomyma) & [Benjamin Ooghe-Tabanou](https://github.com/boogheta) @ SciencesPo [médialab](https://github.com/medialab)

Discover more of our projects at [médialab tools](http://tools.medialab.sciences-po.fr/)

This work is supported by [DIME-WEB](http://dimeweb.dime-shs.sciences-po.fr/) part of [DIME-SHS](http://www.sciencespo.fr/dime-shs/) research equipment financed by the EQUIPEX program (ANR-10-EQPX-19-01).

Hyphe is a free software released under [LGPL](LICENSE.LGPL) &amp; [CECILL-C](LICENSE.CECILL-C) licenses.
