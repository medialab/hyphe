'use strict';

// Requiring some graphology libraries we are going to make global for the user
var randomLayout = require('graphology-layout/random');
window.graphlayout = {
  random: randomLayout
};
window.ForceAtlas2Layout = require('graphology-layout-forceatlas2/worker');
window.Graph = require('graphology');
window.gexf = require('graphology-gexf');
window.Sigma = require('sigma/build/sigma.js')
