// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var Pta = angular.module('pta', [
  'ionic', 
  'swipe', 
  'ngCordova', 
  'ngAria', 
  'ngMaterial', 
  'ngMaterialDatePicker',
  'lk-google-picker',
  'angular-meteor'
  ])
.run(function($ionicPlatform, $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });

  // checking for errors in state change
  $rootScope.$on('$stateChangeError',
    function(event, toState, toParams, fromState, fromParams, error) {
      // We can catch when the $requireUser promise is rejected and redirect to login state
      if (error === 'AUTH_REQUIRED') {
        event.preventDefault();
        $state.go('login');
      }
    });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $stateProvider
  .state('login', {
     url: '/login',
     templateUrl: 'templates/login.html',
     controller : 'LoginCtrl'
   })
   .state('home', {
     url: '/home',
     templateUrl: 'templates/home.html',
     controller: 'HomeCtrl',
     resolve: {
      "currentUser": function($meteor) {
        return $meteor.requireUser();
      }
     }
   })

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html'
    // controller:'AppCtrl'
  })

  .state('app.calendar', {
    url: '/calendar',
    views: {
      'menuContent': {
        templateUrl: 'templates/rcalendar.html',
        controller: 'CalendarCtrl'
      }
    }
  })

  .state('app.volunteer', {
    url: '/volunteer',
    views: {
      'menuContent': {
        templateUrl: 'templates/volunteer.html',
        controller: 'VolunteerCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/calendar');
  $ionicConfigProvider.scrolling.jsScrolling(false);
});
