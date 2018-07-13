var BASE_URL = 'http://localhost:3000';

angular.module('SnailApp', ['ngResource', 'ngMessages', 'ngAnimate', 'toastr', 'ui.router', 'satellizer'])
  .config(function($stateProvider, $urlRouterProvider, $authProvider, $httpProvider) {

    /**
     * Helper auth functions
     */
    var skipIfLoggedIn = ['$q', '$auth', function($q, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.reject();
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }];

    var loginRequired = ['$q', '$location', '$auth', function($q, $location, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.resolve();
      } else {
        $location.path('/login');
      }
      return deferred.promise;
    }];

    /**
     * App routes
     */
    $stateProvider
      .state('home', {
        url: '/',
        controller: 'HomeCtrl',
        templateUrl: 'partials/home.html'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'partials/login.html',
        controller: 'LoginCtrl',
        resolve: {
          skipIfLoggedIn: skipIfLoggedIn
        }
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'partials/signup.html',
        controller: 'SignupCtrl',
        resolve: {
          skipIfLoggedIn: skipIfLoggedIn
        }
      })
      .state('logout', {
        url: '/logout',
        template: null,
        controller: 'LogoutCtrl'
      })
      .state('snail', {
        url: '/snail',
        templateUrl: 'partials/snail.html',
        controller: 'SnailCtrl',
        resolve: {
          loginRequired: loginRequired
        }
      })
      .state('report', {
        url: '/report',
        templateUrl: 'partials/report.html',
        controller: 'SnailCtrl',
        resolve: {
          loginRequired: loginRequired
        }
      })
      .state('profile', {
        url: '/settings',
        templateUrl: 'partials/settings.html',
        controller: 'ProfileCtrl',
        resolve: {
          loginRequired: loginRequired
        }
      });
    $urlRouterProvider.otherwise('/');

    /**
     *  Add the baseURL of the api to each API endpoint
     */
    $httpProvider.interceptors.push(function($q) {
      return {
        'request': function(config) {
          if (config.url.indexOf('/api') === 0) {
            config.url = BASE_URL + config.url;
          }
          return config;
        }
      };
    });
    
    /**
     *  Satellizer config
     */
    $authProvider.facebook({
      clientId: '2036639676649596'
    });
  });
