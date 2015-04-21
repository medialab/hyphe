#!/bin/bash

echo "// Obtained there on the "$(date +%Y-%m-%d)": https://publicsuffix.org/list/
" > hyphe_frontend/app/res/tld_list.tmp 

curl -sL "https://publicsuffix.org/list/effective_tld_names.dat" >> hyphe_frontend/app/res/tld_list.tmp

mv hyphe_frontend/app/res/tld_list.t{mp,xt}
