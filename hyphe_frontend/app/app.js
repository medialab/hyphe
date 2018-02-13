'use strict';

// Declare app level module which depends on views, and components
angular.module('hyphe', [
  'ngRoute'
  ,'jlareau.bowser'
  ,'ngMessages'
  ,'ngSanitize'
  ,'ngMaterial'
  ,'angulartics'
  ,'angulartics.google.tagmanager'
  ,'ngTagsInput'
  ,'hyphe.analytics'
  ,'hyphe.conf'
  ,'hyphe.filters'
  ,'hyphe.services'
  ,'hyphe.service_utils'
  ,'hyphe.service_hyphe_api'
  ,'hyphe.service_glossary'
  ,'hyphe.directives'
  ,'hyphe.controllers'
  ,'hyphe.components'
])

// Route
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {templateUrl: 'views/login.html', controller: 'Login'});
  $routeProvider.when('/admin', {templateUrl: 'views/admin.html', controller: 'Admin'});
  $routeProvider.when('/login2', {redirectTo: '/admin'});
  $routeProvider.when('/project/:corpusId/overview', {templateUrl: 'views/overview.html', controller: 'Overview'});
  $routeProvider.when('/project/:corpusId/importurls', {templateUrl: 'views/importurls.html', controller: 'ImportUrls'});
  $routeProvider.when('/project/:corpusId/definewebentities', {templateUrl: 'views/definewebentities.html', controller: 'DefineWebEntities'});
  $routeProvider.when('/project/:corpusId/newCrawl', {templateUrl: 'views/newCrawl.html', controller: 'NewCrawl'});
  $routeProvider.when('/project/:corpusId/prepareCrawls', {templateUrl: 'views/prepareCrawls.html', controller: 'PrepareCrawls'});
  $routeProvider.when('/project/:corpusId/monitorCrawls', {templateUrl: 'views/monitorCrawls.html', controller: 'monitorCrawls'});
  $routeProvider.when('/project/:corpusId/listWebentities', {templateUrl: 'views/listWebentities.html', controller: 'listWebentities'});
  $routeProvider.when('/project/:corpusId/export', {templateUrl: 'views/export.html', controller: 'export'});
  $routeProvider.when('/project/:corpusId/settings', {templateUrl: 'views/settings.html', controller: 'settings'});
  $routeProvider.when('/project/:corpusId/help', {templateUrl: 'views/help.html', controller: 'help'});
  $routeProvider.when('/project/:corpusId/help/entry/:entry', {templateUrl: 'views/help.html', controller: 'help'});
  $routeProvider.when('/project/:corpusId/manageTags', {templateUrl: 'views/manageTags.html', controller: 'manageTags', reloadOnSearch: false});
  $routeProvider.when('/project/:corpusId/network', {templateUrl: 'views/network.html', controller: 'network'});
  $routeProvider.when('/project/:corpusId/prospect', {templateUrl: 'views/prospect.html', controller: 'prospect'});
  $routeProvider.when('/project/:corpusId/webentity/:webentityId', {templateUrl: 'views/webentity.html', controller: 'webentity'});
  $routeProvider.when('/project/:corpusId/webentityExplorer/:webentityId', {templateUrl: 'views/webentity_explorer.html', controller: 'webentityExplorer', reloadOnSearch: false});
  $routeProvider.when('/project/:corpusId/webentityPagesNetwork/:webentityId', {templateUrl: 'views/webentity_pagesNetwork.html', controller: 'webentityPagesNetwork'});
  $routeProvider.when('/project/:corpusId/tools', {templateUrl: 'views/tools.html', controller: 'tools'});
  $routeProvider.when('/project/:corpusId/tools/netTagStats', {templateUrl: 'views/tool_networkTagStats.html', controller: 'toolNetworkTagStats'});
  $routeProvider.otherwise({redirectTo: '/login'});
}])

// Routing
.config(function($locationProvider) {
   $locationProvider.hashPrefix("")
})

// ngTagsInput
.config(function(tagsInputConfigProvider) {
  tagsInputConfigProvider.setDefaults('tagsInput', {
     minLength: 1
    ,pasteSplitPattern: ""
    ,addOnComma: false
    ,replaceSpacesWithDashes: false
  })
  .setDefaults('autoComplete', {
     minLength: 1
    ,maxResultsToShow: 25
    ,selectFirstMatch: false
    ,loadOnDownArrow: true
    ,loadOnEmpty: true
  })
})

.run(['bowser', function(bowser) {
  if ( bowser.msie ) {
    alert("Outdated browser:\n\nYour browser is not HTML5. Hyphe will not be functional, please use Firefox or another HTML5 browser.");
  }
}])

// Analytics
.config(['$analyticsProvider', function ($analyticsProvider) {
  $analyticsProvider.virtualPageviews(true);
}])

// Color theme
.config(function($mdThemingProvider) {
	$mdThemingProvider.definePalette('hypheBackground', {
    '50': 'f9f7f7',
    '100': 'efebe8',
    '200': 'E2DDD8',
    '300': 'C5BDB5',
    '400': 'A79D93',
    '500': '8E8377',
    '600': '786C60',
    '700': '615448',
    '800': '4D4234',
    '900': '44392C',
    'A100': 'E2D9D3',
    'A200': 'C1B6AE',
    'A400': 'A99486',
    'A700': '7F6656',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
     '200', 'A100'],
    'contrastLightColors': undefined    // could also specify this if default was 'dark'
  })

  $mdThemingProvider.definePalette('hypheBlue', {
    '50': 'e6f1f8',
    '100': 'c0dcee',
    '200': '98c6e3',
    '300': '70afd8',
    '400': '509fd1',
    '500': '328dc7',
    '600': '3489bd',
    '700': '3681ae',
    '800': '387ca1',
    '900': '3c7289',
    'A100': 'c0efff',
    'A200': '8fe3ff',
    'A400': '4cd5ff',
    'A700': '2ca9eb',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
     '200', '300', '400', 'A100', 'A200', 'A400', 'A700'],
    'contrastLightColors': undefined    // could also specify this if default was 'dark'
  })

	$mdThemingProvider.theme('default')
		.primaryPalette('hypheBlue', {
	      'default': '500',
	      'hue-1': '100',  
	      'hue-2': '600',  
	      'hue-3': 'A100'  
	    })
	    .accentPalette('purple', {
	      'default': '300'
	    })
	    .warnPalette('pink')
	    .backgroundPalette('hypheBackground', {
	      'default': '50',
	      'hue-1': '50',
	      'hue-2': '100',
	      'hue-3': '300'
	    })

})

angular.module('hyphe.analytics', [])
.run(['config', function(config) {
  var googleAnalyticsId = config.get('googleAnalyticsId')
  if(googleAnalyticsId) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    ga('create', googleAnalyticsId, 'auto');
  }

}])