'use strict';

// Requiring some graphology libraries we are going to make global for the user
var randomLayout = require('graphology-layout/random');
var forceAtlas2Layout = require('graphology-layout-forceatlas2');
window.graphlayout = {
  random: randomLayout,
  forceAtlas2: forceAtlas2Layout
};
window.Graph = require('graphology');
window.gexf = require('graphology-gexf');
// window.Sigma = require('sigma').default
// window.SigmaWebGLRenderer = require('sigma/renderers/webgl').default