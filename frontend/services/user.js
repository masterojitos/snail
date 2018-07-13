angular.module('SnailApp')
  .factory('User', function($http) {
    return {
      getProfile: function() {
        return $http.get('/api/user');
      },
      updateProfile: function(profileData) {
        return $http.put('/api/user', profileData);
      }
    };
  });
