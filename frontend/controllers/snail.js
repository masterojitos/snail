angular.module('SnailApp')
  .controller('SnailCtrl', function($scope, toastr, Snail) {
    $scope.newSnail = function() {
      Snail.newSnail($scope.snail)
        .then(function(result) {
          toastr.success('A new snail has been stored.');
          $scope.snail.result = result.data;
          $scope.snail.h = '';
          $scope.snail.u = '';
          $scope.snail.d = '';
          $scope.snail.f = '';
        })
        .catch(function(response) {
          toastr.error(response.data.message, response.status);
        });
    };
    $scope.report = function() {
      Snail.report()
        .then(function(result) {
          $scope.report = result.data;
        })
        .catch(function(response) {
          toastr.error(response.data.message, response.status);
        });
    };
  });
