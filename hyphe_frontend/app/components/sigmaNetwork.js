'use strict';

angular.module('hyphe.sigmaNetworkComponent', [])

  .directive('sigmaNetwork', function(
    networkDisplayThreshold,
    $timeout
  ){
    return {
      restrict: 'E'
      ,templateUrl: 'components/sigmaNetwork.html'
      ,scope: {
        network: '=',
        downloadNetwork: '=',
        suspendLayout: '=',             // Optional. Stops layout when suspendLayout becomes true
        startLayoutOnShow: '=',         // Optional. Starts layout when suspendLayout becomes false
        startLayoutOnLoad: '=',         // Optional. Default: true
        onNodeClick: '=',
        onStageClick: '='
      }
      ,link: function($scope, el, attrs) {
        var renderer

        $scope.nodesCount
        $scope.edgesCount
        $scope.tooBig = false
        $scope.loaded = false
        $scope.layout

        $scope.stateOnSuspendLayout = ($scope.startLayoutOnLoad === undefined || $scope.startLayoutOnLoad)

        $scope.$watch('network', function(){
          $scope.loaded = false
          if ( !$scope.network ) return
          $timeout(function(){
            $scope.loaded = true
            $scope.nodesCount = $scope.network.order
            $scope.edgesCount = $scope.network.size
            $scope.tooBig = $scope.nodesCount > networkDisplayThreshold.get()
            refreshSigma()
          })
        })

        $scope.$watch('onNodeClick', updateMouseEvents)

        $scope.$watch('suspendLayout', function(){
          if ($scope.layout === undefined) { return }
          if ($scope.suspendLayout === true) {
            $scope.stateOnSuspendLayout = $scope.layout.running
            $scope.stopLayout()
          } else if ($scope.suspendLayout === false) {
            if ($scope.startLayoutOnShow === true || $scope.stateOnSuspendLayout) {
              $scope.startLayout()
            }
          }
        })

        $scope.displayLargeNetwork = function() {
          networkDisplayThreshold.upTo($scope.nodesCount)
          $scope.tooBig = $scope.nodesCount > networkDisplayThreshold.get()
          refreshSigma()
        }

        $scope.stopLayout = function(){
          if ($scope.layout === undefined) { return }
          $scope.layout.stop()
        }

        $scope.startLayout = function(){
          if ($scope.layout === undefined) { return }
          $scope.layout.start()
        }

        // These functions will be initialized at Sigma creation
        $scope.zoomIn = function(){}
        $scope.zoomOut = function(){}
        $scope.resetCamera = function(){}

        $scope.$on("$destroy", function(){
          $scope.layout.kill()
        })

        /// Functions
        function refreshSigma() {
          $timeout(function(){
            var container = document.getElementById('sigma-div')
            if (!container || !$scope.network.size) return

            renderer = new Sigma.WebGLRenderer($scope.network, container)

            $scope.zoomIn = function(){
              var camera = renderer.getCamera()
              camera.animatedZoom()
            }

            $scope.zoomOut = function(){
              var camera = renderer.getCamera()
              camera.animatedUnzoom()
            }

            $scope.resetCamera = function(){
              var camera = renderer.getCamera()
              camera.animate({ratio: 1.2, x: 0.5, y: 0.5})
            }

            // Defaults to some unzoom
            var camera = renderer.getCamera()
            var state = camera.getState()
            camera.animate({ratio: 1.2, x:0.5, y:0.5})

            if ($scope.layout) {
              $scope.layout.kill()
            }
            $scope.layout = new ForceAtlas2Layout($scope.network, {
              settings: {
                barnesHutOptimize: $scope.network.order > 2000,
                strongGravityMode: true,
                gravity: 0.05,
                scalingRatio: 10,
                slowDown: 1 + Math.log($scope.network.order)
              }
            });
            if (
              ($scope.startLayoutOnLoad || $scope.startLayoutOnLoad === undefined)
              && (!$scope.suspendLayout || $scope.suspendLayout === undefined)
            ) {
              $scope.layout.start()
            }

            updateMouseEvents()

          })
        }

        function updateMouseEvents() {
          if (renderer === undefined) {
            return
          }

          if ($scope.onNodeClick !== undefined) {
            renderer.on('clickNode', function(e){
              $timeout(function(){
                $scope.onNodeClick(e.node)
              })
            })
            renderer.on('enterNode', function(e){
              el[0].classList.add('pointable')
            })
            renderer.on('leaveNode', function(e){
              el[0].classList.remove('pointable')
            })

          }
          if ($scope.onStageClick !== undefined) {
            renderer.on('clickStage', function(e){
              $timeout($scope.onStageClick)
            })
          }

        }

      }
    }
  })
