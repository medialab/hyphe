# Hyphe: web corpus builder & links crawler

Welcome to Hyphe: developped by [SciencesPo's médialab](http://www.medialab.sciences-po.fr/) for the [DIME-SHS Equipex project](http://www.sciencespo.fr/dime-shs/).

Hyphe aims at providing a tool to crawl data from the web to generate networks between what we call WebEntities, which can be singles pages as well as a website or a combination of such.

You can try a restricted version of Hyphe at the following url: [http://hyphe.medialab.sciences-po.fr/demo/](http://hyphe.medialab.sciences-po.fr/demo/)



## Easy install


__DISCLAIMER:__ Hyphe has greatly changed between versions 0.1 and 0.2. Although migrating from an older version was insured as best as possible, it is highly recommended to completely reinstall from scratch. Older corpora can be reran by exporting the list of webentities from the old version and recrawl it from that list of urls in the new version.


For an easy install, the best solution is to download directly the [release version](https://github.com/medialab/Hypertext-Corpus-Initiative/releases), which was built to run against various GNU/Linux distributions (Ubuntu, Debian, CentOS, ...).

Just uncompress the release archive, go into the directory and run the installation script.

This will ask at once for sudo rights, and install possible unsatisfied packages including Java (OpenJDK-6-JRE), Python (python-dev, pip, virtualEnv, virtualEnvWrapper), Apache2, MongoDB, ScrapyD...

If you do not feel comfortable with this, read the script and run the steps line by line or follow the [Advanced install instructions](doc/install.md) below for more control on what is actually installed.

```bash
    # WARNING: DO NOT prefix any of these commands with sudo!
    # install.sh already uses sudo where appropriate and will ask for your password only once.
    tar xzvf hyphe-release-*.tar.gz
    cd Hyphe
    ./bin/install.sh
```

To install from git sources of if you want to help develop Hyphe, please follow the advanced install documentation doc/install.md


### Configure Hyphe

See doc/config.md


### Run Hyphe

Hyphe relies on a web interface communicating with a server which must be running at all times.
To start, stop or restart the server, run (again, NO SUDO):

```bash
    bin/hyphe <start|restart|stop> [--nologs]
```

As soon as it is running, you can visit the web interface on your local machine with the following url: [http://localhost/hyphe](http://localhost/hyphe).

You can check the logs in ```log/hyphe-core.log``` and ```log/hyphe-memorystructure.log```:

```bash
    tail -f log/hyphe-*.log
```


### Serve on the web

See doc/serve.md


### Contributing

See doc/dev.md

### Licence

LGPL / Cecill-C

Mathieu Jacomy @jacomyma
Benjamin Ooghe-Tabanou @boogheta
@medialab

