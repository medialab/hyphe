'use strict';

/* Controllers */

/*
  Getting the scope from the console with our general template:
  s = angular.element('body>div:first>div:first').scope();
*/

angular.module('hyphe.controllers', [
    'hyphe.loginController'
    ,'hyphe.login2Controller'
    ,'hyphe.overviewController'
    ,'hyphe.importurlsController'
    ,'hyphe.definewebentitiesController'
    ,'hyphe.newcrawlController'
    ,'hyphe.checkstartpagesController'
    ,'hyphe.schedulecrawlController'
    ,'hyphe.monitorcrawlsController'
    ,'hyphe.listwebentitiesController'
    ,'hyphe.exportController'
    ,'hyphe.settingsController'
    ,'hyphe.networkController'
  ])

;

