===================================
HCI PROJECT - TODO & pending issues
===================================

TODO for prototype
------------------

- implement new scrapyd api methods: {listjobs,jobinfo,cancel}.json

- implement storage & queue using kyoto cabinet

- implement error handling. possible errors:

  - connection error
  - timeout error
  - dns error
  - response too big
  - forbidden by robots.txt?


TODO for beta version
---------------------

- implement robots.txt middleware

- respect rel=nofollow based on flag passed in spider arguments

- packaging?


OTHER (MINOR PRIORITY)
----------------------

- t:80 component after host component may be better?
- h:www - normalize somehow?. because otherwise we always have to include 2

