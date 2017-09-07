'use strict';

/*
 *	NB: The Hyphe configuration is written as an Angular service
 */

angular.module('hyphe.conf', [])

  // .constant('serverURL', 'http://hyphe.medialab.sciences-po.fr/dimeweb-api/')
  .constant('serverURL', 'http://hyphe.medialab.sciences-po.fr/dev-mathieu-api/')
  .constant('googleAnalyticsId', '')
  .constant('disclaimer', 'This is a restricted version of Hyphe for demonstration and testing only. Crawls are limited to a 1-click depth. Contents are deleted every week.')

;
