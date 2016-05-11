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
  'firebase',
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

// URL of the firebase database to be used in controllers and factories
.constant('FIREBASE_URL', 'https://sizzling-fire-7440.firebaseio.com')

// Watches for authentication event. If login occurs, then get the user's profile info and go to calender or volunteer page
.factory('Auth', function($firebaseAuth, $timeout, $rootScope, FIREBASE_URL, $firebaseObject, $location){
  var ref = new Firebase(FIREBASE_URL);
  var auth = $firebaseAuth(ref);
  return {
    // helper method to login with multiple providers
    loginWithProvider: function loginWithProvider(provider) {
      return auth.$authWithOAuthPopup(provider);
    },
    // wrapping the unauth function
    logout: function logout() {
      auth.$unauth();
    },
    // Watch for an authentication event
    onAuth: function onLoggedIn(callback) {
      auth.$onAuth(function(authData) {
        // If user is successfully authenticated, then get their profile
        if (authData) {
          var ref = new Firebase(FIREBASE_URL);
          var userID = authData.uid;
          var profileObjectRef = ref.child('users').child(userID);
          $rootScope.profile = $firebaseObject(profileObjectRef);
          $rootScope.profile.$loaded(
            function(data) {
              // After user's profile data is loaded, go to calender or volunteer page
              // depending of if they are an admin or not
              if (data.isAdmin) {
                $location.path('/app/calendar');
              } else {
                $location.path('/app/volunteer');
              }
            }
          );
        } else {
          // If the user is not successfully authenticated, go back to login page
          $rootScope.profile = null;
          $location.path('/login');
        };       
      }); // auth.$onAuth
    } // onAuth
  };
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
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
  $urlRouterProvider.otherwise('/login');
  $ionicConfigProvider.scrolling.jsScrolling(false);
});
