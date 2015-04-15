# Serve Hyphe

## Troobleshooting

If `http://localhost/hyphe` is unaccessible and Apache says "403 Forbidden", you probably have rights issues. Apache's group (usually `www-data`, `apache` or `httpd`) needs read access to Hyphe's installation directory. You can usually solve this by running:
```bash
# Where <HYPHE_ROOT_PATH> is the path where Hyphe was installed
sudo chmod -R g+rx <HYPHE_ROOT_PATH>
sudo chown -R :www-data <HYPHE_ROOT_PATH>
```

On some distributions, if you installed within a /home directory, you may need to run similar commands on your `/home/<USER>` directory (which is quite unclean...), or you can move your install to another more fitted directory (`/srv`, `/opt`...), give it the proper rights and fix the parts of the install involving the path (basically change the various paths in `config.json` and `apache2.conf` of the `config` directory, and regenerate the symbolic link (`ln -s`) in Apache's directory to Hyphe's Apache config).


## Make Hyphe accessible from the web

To run the website on a distant server and make Hyphe accessible from the web, a few more adjustments are required:

- Adapt your Apache configuration in `config/apache2.conf` with your server settings (your domain name and/or port using `ServerName`, the actual path to the frontend in the first line `Alias`, restrain access for instance using `AuthType`, setup SSL, etc.)

- Optionally setup a GoogleAnalytics id in `hyphe_frontend/app/conf/conf.js`


