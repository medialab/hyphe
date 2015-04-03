# Serve Hyphe on the web

To run on a server and not only locally, a few adjustments need to be performed:

* Adapt your apache configuration in ```hyphe_www_client/_config/apache2.conf``` with your personal settings (ServerName, ...)

* Adapt the web interface API endpoint in ```hyphe_www_client/_config/config.js``` by replacing localhost into the actual domain name, for instance:

```bash
    "SERVER_ADDRESS":"http://www.example.com/hyphe-api",
```

 - If Apache is still reluctant to serve Hyphe's frontend and API and you encounter for instance 403 errors, please [report an issue](https://github.com/medialab/Hypertext-Corpus-Initiative/issues).


