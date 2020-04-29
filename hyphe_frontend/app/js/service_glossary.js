'use strict';

angular.module('hyphe.service_glossary', [])

  .factory('glossary', [function(){
    var ns = {}     // namespace
    
    ns.definitions = [
      {
        title: 'Cautious Crawl'
        ,definition: 'A mode using browser emulation to crawl, 20 times slower but required for some entities. Auto-activated on some domains.'
        ,entries: ['cautious crawl', 'cautious crawls', 'cautious crawling']
      },{
        title: 'Crawl'
        ,definition: 'Process of harvesting text and links from the web'
        ,entries: ['crawl', 'crawls', 'crawling', 'web crawl', 'web crawls', 'web crawling']
      },{
        title: 'Crawl Depth'
        ,definition: 'How many clicks from the start page(s) we harvest a web entity'
        ,entries: ['depth', 'crawl depth']
      },{
        title: 'Crawl job'
        ,definition: 'Task of crawling a single web entity with specific settings'
        ,entries: ['crawl job', 'crawl jobs']
      },{
        title: 'Boundaries of a Web Entity'
        ,definition: 'Defines if a web entity is a whole domain, a subdomain, a page or a combination of those'
        ,entries: ['boundaries', 'boundaries of a web entity', 'boundaries of web entities']
      },{title: 'Ego Network'
        ,definition: 'The network of links between the web entities that are linked with this one'
        ,entries: ['ego network, Ego Network, ego networks']
      },{
        title: 'Hyperlink'
        ,definition: 'A reference to a web page that the reader can directly follow by clicking. Hyphe uses hyperlink to generate a network.'
        ,entries: ['hyperlink', 'hyperlinks', 'link', 'links', 'hypertext link', 'hypertext links']
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
        title: 'Page'
        ,definition: 'A web document accessible from a URL and suitable for a web browser, usually written in HTML'
        ,entries: ['web page', 'web pages', 'page', 'pages']
      },{
        title: 'Home Page'
        ,definition: 'The default URL used to access a web entity, generally its actual homepage'
        ,entries: ['home page', 'homepage']
      },{
        title: 'Start Page'
        ,definition: 'In a web entity, Hyphe crawls it to find links and other pages, step by step'
        ,entries: ['start page', 'start pages', 'start url', 'start urls', 'startpage', 'startpages']
      },{
        title: 'Timestamp'
        ,definition: 'A number encoding a date and time, ie. the count in milliseconds since 00:00:00 UTC on January 1, 1970'
        ,entries: ['timestamp', 'timestamps']
      },{
        title: 'URL'
        ,definition: 'A URL is a URI that identifies a web resource (and specifies the means of obtaining the representation of it)'
        ,entries: ['url', 'urls', 'address', 'addresses']
      },{
        title: 'URI'
        ,definition: 'A "Uniform Resource Identifier" is a string of characters used to identify a digital resource'
        ,entries: ['uri', 'uris']
      },{
        title: 'Web browser'
        ,definition: 'A software application for retrieving, presenting, and traversing information resources on the web, like Chrome or Firefox'
        ,entries: ['web browser', 'web browsers', 'browser', 'browsers']
      },{
        title: 'Web crawler'
        ,definition: 'A script or application performing web crawls'
        ,entries: ['web crawler', 'web crawlers', 'crawler', 'crawlers']
      },{
        title: 'Web Entity'
        ,definition: 'Used in Hyphe to describe a website, an actor, or any set of pages you consider as a whole'
        ,entries: ['web entity', 'web entities']
      },{
        title: 'Web Entity Identifier'
        ,definition: 'Sequence of characters identifying a web entity. Necessary because different web entities may have the same name.'
        ,entries: ['web entity identifier', 'web entities identifiers']
      },{
        title: 'Website'
        ,definition: 'Intuitive notion of a coherent group of pages, it has no technical reality and cannot be characterized except by curation'
        ,entries: ['website', 'websites', 'site', 'sites']
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

