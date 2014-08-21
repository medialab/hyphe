'use strict';

angular.module('hyphe.service_glossary', [])

  .factory('glossary', [function(){
    var ns = this     // namespace
    
    ns.definitions = [
      {
        title: 'Crawl'
        ,definition: 'Process of harvesting text and links from the web'
        ,entries: ['crawl', 'crawls', 'crawling']
      },{
        title: 'Boundaries of a Web Entity'
        ,definition: 'Defines if a web entity is a whole domain, a subdomain, a page or a combination of those'
        ,entries: ['boundaries', 'boundaries of a web entity', 'boundaries of web entities']
      },{
        title: 'HTTPS Variations'
        ,definition: 'URLs that differ only by using the secured protocol "https". Ex: https://google.com and http://google.com'
        ,entries: ['https variation', 'https variations']
      },{
        title: 'Start Page'
        ,definition: 'In a web entity, Hyphe crawls it to find links and other pages, step by step'
        ,entries: ['start page', 'start pages']
      },{
        title: 'Web Entity'
        ,definition: 'Used in Hyphe to describe a website, an actor, or any set of pages you consider as a whole'
        ,entries: ['web entity', 'web entities']
      },{
        title: 'WWW Variations'
        ,definition: 'URLs that differ only by the presence of the www subdomain. Ex: www.google.com and google.com'
        ,entries: ['www variation', 'www variations']
      }
    ]

    ns.entries = {}
    ns.definitions.forEach(function(def, i){
      def.entries.forEach(function(entry){
        ns.entries[entry] = i
      })
    })

    return function(term){
      return ns.definitions[ns.entries[term.toLocaleLowerCase()]]
    }
  }])

;