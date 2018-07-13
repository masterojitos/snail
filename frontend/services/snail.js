angular.module('SnailApp')
  .factory('Snail', function($http) {
    return {
      newSnail: function(snailData) {
        return $http.post('/api/snail', snailData);
      }, 
      report: function() {
        return $http.get('/api/snail');
      }
    };
  });
