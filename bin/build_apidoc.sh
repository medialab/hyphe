#!/bin/bash


echo "API documentation
=================

Hyphe relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.

_Note:_ as it relies on the JSON-RPC protocol, it is not quite easy to test the API methods from a browser hacing to send arguments through POST, but you can test directly from the command-line using the dedicated tools, see the [Developpers' documentation](doc/dev.md).


## Default API commands (no namespace)" > doc/api.md

defcorpus=$(grep DEFAULT_CORPUS hyphe_backend/lib/config_hci.py | head -n 1 | sed 's/^.*= //' | sed s'/"//g')
downloaddelay=$(grep download_delay config/config.json.example | head -n 1 | sed 's/^.*: //' | sed 's/[ ,]\+//')

grep 'def jsonrpc_\|accessible jsonrpc\|"""' hyphe_backend/core.tac |
 sed 's/# accessible jsonrpc.*\(".*"\)/\n\n## Commands for namespace: \1/' |
 sed 's/_/\\_/g' |
 sed 's/^ \+"""/ /' |
 sed 's/"""$/\n/' |
 sed 's/^.*jsonrpc\\_/\n- __/' |
 sed 's/(self[, ]*/:__\n + _/' |
 sed 's/):$/\n/' |
 grep -v '^ + _$' |
 sed 's/, /\n + _/g' |
 sed 's/^ + \(_[a-z\\_]\+_*\)$/ + \1_ (mandatory)/i' |
 sed 's/=\("*.*"*\)$/_ (optional, default: \1)/' |
 sed 's/ms.WebEntityStatus.*IN]/"IN"/' |
 sed "s/config\['mongo-scrapy'\]\['download_delay'\]/$downloaddelay/" |
 sed 's/DEFAULT\\_CORPUS/"'"$defcorpus"'"/' |
 sed 's/None/null/' |
 sed 's/"\([0-9]\+\)"/\1/' |
 sed 's/\(F\|T\)\(alse\|rue\)/\L\1\2/' >> doc/api.md

