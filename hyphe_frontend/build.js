// CSS Files
require('angular-xeditable/dist/css/xeditable.css');
require('ng-tags-input/build/ng-tags-input.min.css');
require('angular-material/angular-material.min.css');

// Angular dependencies
require('angular');
require('angular-route');
require('angular-sanitize');
require('angular-messages');
require('angular-sanitize');
require('angular-animate');
require('angular-aria');
require('angular-material');
require('angulartics');
require('angulartics/dist/angulartics-gtm.min.js');
require('angular-md5');
require('angular-xeditable');
require('ng-tags-input');

// D3
window.d3 = require('d3');

// FileSaver
window.saveAs = require('file-saver').saveAs;

// Graphology & Sigma
var randomLayout = require('graphology-layout/random');
window.graphlayout = {
  random: randomLayout
};
window.ForceAtlas2Layout = require('graphology-layout-forceatlas2/worker');
window.Graph = require('graphology');
window.gexf = require('graphology-gexf');
window.Sigma = require('sigma/build/sigma.js')
