#!/bin/bash


echo "# API documentation

Hyphe relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.

_Note:_ as it relies on the JSON-RPC protocol, it is not quite easy to test the API methods from a browser (having to send arguments through POST), but you can test directly from the command-line using the dedicated tools, see the [Developers' documentation](dev.md).


## Data &amp; Query format

The current JSON-RPC 1.0 implementation requires to provide arguments as an ordered array of the methods arguments. Call with named arguments is possible but not well handled and not recommanded until we migrate to REST.

The API will always answer as such:
- Success:
\`\`\`json
{
  \"code\": \"success\",
  \"result\": \"<The actual expected result, possibly an objet, an array, a number, a string, ...>\"
}
\`\`\`
- Error:
\`\`\`json
{
  \"code\": \"fail\",
  \"message\": \"<A string describing the possible cause of the error.>\"
}
\`\`\`


## Summary
- [Default API commands (no namespace)](#default-api-commands-no-namespace)" > doc/api.md

grep 'def jsonrpc_\|accessible jsonrpc\|^  #' hyphe_backend/core.tac        |
 sed 's/# accessible jsonrpc.*\(".*"\)/- [Commands for namespace: \1](#/'   |
 sed 's/^  #\s*\(.*\)$/+ [\1](#/'                                           |
 sed 's/^.*jsonrpc\_\(.*\)(self.*$/* __`\1`__/' > /tmp/hyphedocapi.tmp

cat /tmp/hyphedocapi.tmp | while read line; do
  if echo "$line" | grep "](#$" > /dev/null; then
    rep=$(echo $line | sed 's/^[+\-\* ]*\[//' | sed 's/\](#$//' | sed 's/\W\+/-/g' | sed 's/^\(.*\)$/\L\1/' | sed 's/^-//' | sed 's/-$//')
    line="$line$rep)"
  fi
  echo "$line" | sed 's/^\*/    */' | sed 's/^+/  +/' >> doc/api.md
done

echo "

## Default API commands (no namespace)" >> doc/api.md

defcorpus=$(grep DEFAULT_CORPUS hyphe_backend/lib/config_hci.py | head -n 1 | sed 's/^.*= //' | sed s'/"//g')
downloaddelay=$(grep download_delay config/config.json.example | head -n 1 | sed 's/^.*: //' | sed 's/[ ,]\+//')

grep 'def jsonrpc_\|accessible jsonrpc\|^        """\|^  #' hyphe_backend/core.tac   |
 sed 's/# accessible jsonrpc.*\(".*"\)/\n\n## Commands for namespace: \1/'  |
 sed 's/^  #\s*/### /'                                                      |
 sed 's/^ \+"""/ /'                                                         |
 sed 's/"""$/\n/'                                                           |
 sed 's/^.*jsonrpc\_/\n- __`/'                                              |
 sed 's/(self[, ]*/`:__\n  + _`/'                                           |
 sed 's/):$/\n/'                                                            |
 sed 's/\\n- /\n  * /g'                                                     |
 sed 's/\\n\s*/\n /g'                                                       |
 grep -v '^  + _`$'                                                         |
 sed 's/\([^\\]\), /\1\n  + _`/g'                                           |
 sed 's/\\,/,/g'                                                            |
 sed 's/^  + \(_`[a-z_]\+_*\)$/  + \1`_ (mandatory)/i'                      |
 sed 's/=\("*.*"*\)$/`_ (optional, default: `\1`)/'                         |
 grep -v '^  + _`_'                                                         |
 sed 's/ms.WebEntityStatus.*IN]/"IN"/'                                      |
 sed "s/config\['mongo-scrapy'\]\['download_delay'\]/$downloaddelay/"       |
 sed 's/DEFAULT_CORPUS/"'"$defcorpus"'"/'                                   |
 sed 's/None/null/'                                                         |
 sed 's/"\([0-9]\+\)"/\1/'                                                  |
 sed 's/\(F\|T\)\(alse\|rue\)/\L\1\2/' >> doc/api.md

