'use strict';

/* Controllers */

/*
  Getting the scope from the console with our general template:
  s = angular.element('body>div:first>div:first').scope();
*/

angular.module('hyphe.controllers', [
    'hyphe.loginController'
    ,'hyphe.adminController'
    ,'hyphe.overviewController'
    ,'hyphe.importurlsController'
    ,'hyphe.definewebentitiesController'
    ,'hyphe.preparecrawlsController'
    ,'hyphe.monitorcrawlsController'
    ,'hyphe.listwebentitiesController'
    ,'hyphe.exportController'
    ,'hyphe.settingsController'
    ,'hyphe.manageTagsController'
    ,'hyphe.networkController'
    ,'hyphe.prospectController'
    ,'hyphe.webentityController'
    ,'hyphe.webentityExplorerController'
    ,'hyphe.webentityPagesNetworkController'
    ,'hyphe.helpController'
    ,'hyphe.toolsController'
    ,'hyphe.toolNetworkTagStatsController'
  ])

;

