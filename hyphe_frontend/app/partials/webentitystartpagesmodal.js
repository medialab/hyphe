'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, webentity) {
    $scope.webentity = webentity

    console.log('MODAL CTRL ALIVE', webentity)

    $scope.ok = function () {
      var feedback = {

      }

      $modalInstance.close(feedback)
    }

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }
  })

/* Modal controller */
function webentityStartPagesModalController($scope, $modalInstance, webentity) {
  
}