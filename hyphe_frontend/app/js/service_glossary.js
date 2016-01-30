'use strict';

angular.module('hyphe.service_glossary', [])

  .factory('glossary', [function(){
    var ns = this     // namespace
    
    ns.definitions = [
      {
        title: 'Cautious Crawl'
        ,definition: 'A mode using browser emulation to crawl, 20 times slower but required for some entities. Auto-activated on some domains.'
        ,entries: ['cautious crawl', 'cautious crawls', 'cautious crawling']
      },{
        title: 'Crawl'
        ,definition: 'Process of harvesting text and links from the web'
        ,entries: ['crawl', 'crawls', 'crawling']
      },{
        title: 'Crawl Depth'
        ,definition: 'How many clicks from the start page(s) we harvest a web entity'
        ,entries: ['depth', 'crawl depth']
      },{
        title: 'Boundaries of a Web Entity'
        ,definition: 'Defines if a web entity is a whole domain, a subdomain, a page or a combination of those'
        ,entries: ['boundaries', 'boundaries of a web entity', 'boundaries of web entities']
      },{
        title: 'LRU'
        ,definition: 'Equivalent of an URL but reordered from the most generic to the most specific part. Used for web entity prefixes.'
        ,entries: ['lru', 'lrus', 'reverse url', 'reverse urls']
      },{
        title: 'Prefix of a Web Entity'
        ,definition: 'A sort of URL used to define the boundaries of a web entity: if a URL begins with the prefix, it belongs to this web entity'
        ,entries: ['web entity prefix', 'web entity prefixes', 'web entities prefixes', 'prefix', 'prefixes']
      },{
        title: 'HTTPS Variations'
        ,definition: 'URLs that differ only by using the secured protocol "https". Ex: https://google.com and http://google.com'
        ,entries: ['https variation', 'https variations']
      },{
        title: 'Start Page'
        ,definition: 'In a web entity, Hyphe crawls it to find links and other pages, step by step'
        ,entries: ['start page', 'start pages', 'start url', 'start urls']
      },{
        title: 'Timestamp'
        ,definition: 'A number encoding a date and time, ie. the count in milliseconds since 00:00:00 UTC on January 1, 1970'
        ,entries: ['timestamp', 'timestamps']
      },{
        title: 'Web Entity'
        ,definition: 'Used in Hyphe to describe a website, an actor, or any set of pages you consider as a whole'
        ,entries: ['web entity', 'web entities']
      },{
        title: 'Web Entity Identifier'
        ,definition: 'Sequence of characters identifying a web entity. Necessary because different web entities may have the same name.'
        ,entries: ['web entity identifier', 'web entities identifiers']
      },{
        title: 'WWW Variations'
        ,definition: 'URLs that differ only by the presence of the www subdomain. Ex: www.google.com and google.com'
        ,entries: ['www variation', 'www variations']
      }
    ]

    // Consolidate definitions by adding identifiers
    ns.definitions.forEach(function(d, i){
      d.id = i
    })

    ns.entries = {}
    ns.definitions.forEach(function(def, i){
      def.entries.forEach(function(entry){
        ns.entries[entry] = i
      })
    })

    ns.getDefinition = function (term) {
      return ns.definitions[ns.entries[term.toLocaleLowerCase()]]
    }

    return ns
  }])

;