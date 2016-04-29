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
  'sails.io'
  ])
.run(function($ionicPlatform) {
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
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
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
