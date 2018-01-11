# Hyphe: web corpus builder & links crawler

Welcome to Hyphe: developped by [SciencesPo's médialab](http://www.medialab.sciences-po.fr/) for the [DIME-SHS Web project (Equipex)](http://www.sciencespo.fr/dime-shs/).

[Hyphe](http://hyphe.medialab.sciences-po.fr) aims at providing a tool to crawl data from the web to generate networks between what we call WebEntities, which can be single pages as well as a website or a combination of such.

## Demo

You can try a limited version of Hyphe at the following url: [http://hyphe.medialab.sciences-po.fr/demo/](http://hyphe.medialab.sciences-po.fr/demo/)


## How to install it?

__DISCLAIMER:__ Hyphe has changed a lot in the past few years. Migrating from an older version by pulling the code from git is therefore not guaranteed, it is highly recommended to reinstall from scratch. Older corpora can be reran by exporting the list of WebEntities from the old version and recrawl from that list of urls in the new version.

Before running Hyphe, you will probably want to adjust the settings first. Please read the [Configuration documentation](doc/config.md) for detailed explanation of each available option.


### Easy way: using Docker

For an easy install either on Linux, Mac OS X or Windows, the best solution is to rely on [Docker](https://www.docker.com).

Docker enables isolated install and execution of software stacks, which makes simple installing a whole set of dependencies. Although, you should ensure at least 4GB of empty space is available before installing.

First follow [Docker's installation instructions](https://docs.docker.com/installation/) to install Docker on your machine.

Once you've got Docker installed and running, [install Docker Compose](https://docs.docker.com/compose/install/) to set up and orchestrate Hyphe services in a single line (it might already come built-in with Docker when installing on Windows or Mac OS X).

Then you just need to get or build Hyphe's Docker images:

- First download Hyphe's codebase from this git repository (recommended way to benefit from future updates) or from a [zipped release](https://github.com/medialab/hyphe/releases) and enter the resulting directory.

```bash
git clone https://github.com/medialab/hyphe.git hyphe
cd hyphe
```

- Then copy the default configuration files and edit them to adjust the settings to your needs:

```bash
cp .env.example .env
cp config-backend.env.example config-backend.env
cp config-frontend.env.example config-frontend.env
```

The `.env` file lets you configure:
 + `TAG`: the reference Docker image you want to work with:

   +  `latest` (or `prod`) for the last stable release
   + `staging` for intermediate unstable developments

 + `PUBLIC_PORT`: the web port on which Hyphe will be served (usually 80 for a monoservice server, or any other value you like and will have to redirect for a shared host)
 + `DATA_PATH`: using Hyphe can quickly consume several gigabytes of hard drive. By default, volumes will be stored within Docker's default directories but you can define your own path here.

__WARNING:__ `DATA_PATH` MUST be either empty, or a full absolute path including leading and trailing slashes. When installing under Windows, it should always remain empty (so you should install Hyphe from a drive with enough available space).

Hyphe's internal settings are adjustable within `config-backend.env` and `config-frontend.env`. Adjust the settings values to your needs following [recommendations from the config documentation](doc/config.md).


- Then build or collect the Hyphe's Docker containers:

 + Either by pulling official images from Docker Store (recommended way):

```bash
docker-compose pull
```

 + Or by building your own images from the source code (mostly for development when editing the sourcecode, and for some specific configuration settings):

```bash
docker-compose build
```

It will take a couple of minutes to download or build everything.

- Finally run Hyphe containers with the following command:

```bash
docker-compose up
```

It will display all of Hyphe's logs in the console and stop Hyphe when pressing ```Ctrl+C```.

Or to run the containers in the background:

```bash
docker-compose up -d
```

Then to stop it, use `docker-compose stop` (or `docker-compose down` to stop it and remove all relying data).

You can inspect the logs of the various Docker containers using ```docker-compose logs```, or with option `-f` to track latest entries.

Whenever you change any configuration file, restart the Docker container to take the changes into account:

```bash
docker-compose stop
docker-compose up -d
```

Run `docker-compose help` to get more explanations on any extra advanced use of Docker.

If you encounter issues with the Docker builds, please report an [issue](/issues) including the "Image ID" of the Docker images you used from the output of `docker images` or the last commit ID (read from `git log`) if you installed from source.


### Manual way (complex) (only for Linux)

If your computer or server relies on an old Linux distribution unable to run Docker, if you want to contribute to Hyphe's backend development or for any other personal reason, you might want to rather install Hyphe manually by following the [manual install instructions](doc/install.md).

Please note there are many dependencies which are not always trivial to install and that you might run in quite a bit of issues. You can ask for some help by [opening an issue](https://github.com/medialab/hyphe/issues) and describing your problem, hopefully someone will find some time to try and help you.

Hyphe relies on a web interface with a server daemon which must be running at all times. When manually installed, one must start, stop or restart the daemonto run it (without `sudo`):

```bash
bin/hyphe <start|restart|stop> [--nologs]
```

By default the starter will display Hyphe's log in the console using ```tail```. You can ```Ctrl+C``` whenever you want without shutting it off. Use the ```--nologs``` option to disable this.

All settings can be configured directly from the global configuration file ```config/config.json```. Restart Hyphe afterwards to take changes into account: ```bin/hyphe restart```

You can always check the logs for both the core backend and each corpus' MemoryStructure in the ```log``` directory.


### Serve Hyphe on the web

As soon as the Docker container or the manual daemon is started, you can start playing with the web interface on your local machine at the following url:
- Docker install: [http://localhost/](http://localhost/)
- manual install: [http://localhost/hyphe](http://localhost/hyphe).

For personal uses, you can already use Hyphe as such. Although, if you want to let others use it as well (typically if you installed on a distant server), you need to serve it on a webserver and make a few adjustments.

Read the [dedicated documentation](doc/serve.md) to do so.


## Advanced developers features & contributing

Please read the dedicated [Developers documentation](doc/dev.md) and the [API description](doc/api.md).


## What's next?

See our [roadmap](doc/roadmap.md)!


## Papers and references

### Tutorials

* Explanatory video (french) [Explorer les internets avec Hyphe](https://vimeo.com/235804282) (Septembre 2017, in French). Mathieu Jacomy presents Hyphe at Sciences Po CEVIPOF during METSEM, a seminar on digital methods in social sciences.

### Papers about Hyphe

* JACOMY, Mathieu, GIRARD, Paul, OOGHE, Benjamin, et al. [Hyphe, a curation-oriented approach to web crawling for the social sciences.](http://www.aaai.org/ocs/index.php/ICWSM/ICWSM16/paper/view/13051/12797) In : International AAAI Conference on Web and Social Media. Association for the Advancement of Artificial Intelligence, 2016.

### Papers using Hyphe

* Venturini, T., Jacomy, M., Bounegru, L., & Gray, J. (2018, forthcoming). [Visual Network Exploration for Data Journalists](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3043912). In S. E. I. and B. Franklin (Ed.). Abingdon: Routledge.

* Froio Caterina, "[Nous et les autres. L’altérité sur les sites web des extrêmes droites en France](http://www.cairn.info/article.php?ID_ARTICLE=RES_202_0039&WT.mc_id=RES_202)", Réseaux, 2017/2 (n° 202-203), p. 39-78. DOI : 10.3917/res.202.0039.

* [The AfD’s Facebook Wall as a Hub for Right-Wing Mobilisation in Germany](http://www.kai-arzheimer.com/my-apsa-2015-paper-the-afds-facebook-wall-as-a-hub-for-right-wing-mobilisation-in-germany/)

* Pedroja, Cynthia, et al. "[Dépasser la liste : quand la bibliothèque entre dans la danse des corpus web.](https://hal.archives-ouvertes.fr/hal-01386536/document)" Digital Humanities 2016 (DH2016). Jagiellonian University & Pedagogical University, 2016.

* de Carvalho Pereira, Débora "[Produits laitiers : les réseaux d'influence sur le web](https://f.hypotheses.org/wp-content/blogs.dir/3105/files/2017/10/Rapport-REPASTOL-PEREIRA-2017.compressed.pdf)"


## Credits & License

[Mathieu Jacomy](https://github.com/jacomyma), [Benjamin Ooghe-Tabanou](https://github.com/boogheta) & [Guillaume Plique](https://github.com/Yomguithereal) @ [Sciences Po médialab](https://github.com/medialab)

Discover more of our projects at [médialab tools](http://tools.medialab.sciences-po.fr/)

This work is supported by [DIME-WEB](http://dimeweb.dime-shs.sciences-po.fr/) part of [DIME-SHS](http://www.sciencespo.fr/dime-shs/) research equipment financed by the EQUIPEX program (ANR-10-EQPX-19-01).

Hyphe is a free open source software released under [AGPL 3.0 license](LICENSE.AGPL).

<blockquote>
*[...] I hear _kainos_ [(greek: "now")] in the sense of thick, ongoing presence, with __hyphae__ infusing all sorts of temporalities and materialities."*

Donna J. Haraway, Staying with the Trouble, Making kin with the Chthlucene p.2
</blockquote>
