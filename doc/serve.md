# Serve Hyphe's website

## If you installed with Docker

If Hyphe is the only web service your server will host, you can already access it directly on the Docker host IP address such as [http://127.0.0.1](http://127.0.0.1).

By default `docker-compose` runs its image to be served on the port 80, so if your server is bound for instance to mySuperHyphe.com, Hyphe will be immediately accessible at this url.

If your server already exposes the port 80 for another service, Docker will fail to run Hyphe (with an error ```bind: address already in use```), you should either deactivate your existing webservice or edit the `.env` configuration file and change the `PUBLIC_PORT` value from 80 into the desired port then restart the container by running ```docker-compose stop && docker compose up -d```. You can then serve Hyphe using for instance Apache or Nginx by redirecting the port to another domain or path.

For instance if you've setup Docker to serve Hyphe on port 8081, and you want it accessible on "http://www.MyGreatDomain.com/hyphe/", you can do so with Apache like this:

```apache
<VirtualHost *:80>
  ServerName mygreatdomain.com
  <Location /hyphe>
    ProxyPass http://localhost:8081/ connectiontimeout=30 timeout=900
    ProxyPassReverse http://localhost:8081/
  </Location>
</VirtualHost>
```


## If you installed manually

### Apache Troobleshooting

If `http://localhost/hyphe` is unaccessible and Apache says "403 Forbidden", you probably have filesystem rights issues. Apache's group (usually `www-data`, `apache` or `httpd`) needs read access to Hyphe's installation directory. You can usually solve this by running:
```bash
# Where <HYPHE_ROOT_PATH> is the path where Hyphe was installed
sudo chmod -R g+rx <HYPHE_ROOT_PATH>
sudo chown -R :www-data <HYPHE_ROOT_PATH>
```

On some distributions, if you installed within a `/home` directory, you may need to run similar commands on your `/home/<USER>` directory (which is quite unclean...), or you can move your install to another more fitted directory (`/srv`, `/opt`...), give it the proper rights and fix the parts of the install involving the path (basically change the various paths in `config.json` and `apache2.conf` of the `config` directory, and regenerate the symbolic link (`ln -s`) in Apache's directory to Hyphe's Apache config).


### Expose Hyphe to the web

To run the website on a distant server and make Hyphe accessible from the web, adapt your Apache configuration in `config/apache2.conf` with your server settings (your domain name and/or port using `ServerName`, the actual path to the frontend in the first line `Alias`, restrain access for instance using `AuthType`, setup SSL, etc.)

