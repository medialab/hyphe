# Serve Hyphe

## Make Hyphe accessible from the web

Adapt your apache configuration in `config/apache2.conf` with your server settings (ServerName, ...).


## Troobleshooting

If `http://localhost/hyphe` is unaccessible and apache says "403 Forbidden", you probably have rights issues. Apache's group (usually `www-data`, `apache` or `httpd`) needs read access to Hyphe's installation directory. You can usually solve this by running:
```bash
    # Where <HYPHE_ROOT_PATH> is the path where Hyphe was installed
    sudo chmod -R g+rx <HYPHE_ROOT_PATH>
    sudo chown -R :www-data $(pwd)
```

On some distributions, if you installed within a /home directory, you may need to run similar commands on your `/home/<USER>` directory (which is quite unclean...), or you can move your install to another more fitted directory (`/srv`, `/opt`, ...), give it the proper rights and fix the parts of the install involving the path (basically change the various paths in `config.json` and `apache2.conf` of the `config` directory, and change apache's link to hyphe's config).

