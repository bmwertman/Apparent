var Pta = angular.module('pta', [
  'ionic', 
  'swipe', 
  'ngCordova', 
  'ngAria', 
  'ngMaterial', 
  'ngMaterialDatePicker',
  'lk-google-picker',
  'firebase',
  'validation.match',
  'offClick',
  'xeditable',
  'jrCrop',
  'naif.base64',
  angularDragula(angular)
  ])
.run(function($ionicPlatform, $rootScope, Auth, FIREBASE_URL, editableThemes, editableOptions) {
  // hide xeditable cancel button
  editableThemes['default'].cancelTpl = '<button type="button" class="btn btn-default" style="display:none">';
  editableThemes['default'].submitTpl = '<button type="submit" class="xeditable-submit fa fa-pencil-square-o"></button>';

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

  $rootScope.logout = function() {
    Auth.logout(); 
  }; 

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

// URL of the firebase database to be used in controllers and factories
.constant('FIREBASE_URL', 'https://sizzling-fire-7440.firebaseio.com')

// Watches for authentication event. If login occurs, then get the user's profile info and go to calender or volunteer page
.factory('Auth', function($firebaseAuth, $timeout, $rootScope, FIREBASE_URL, $firebaseObject, $location, userService){
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
          userService.setUser($firebaseObject(profileObjectRef));
          $rootScope.profile.$loaded(
            function(data) {
              // After user's profile data is loaded, go to calender or volunteer page
              // depending of if they are an admin or not
              if (data.isAdmin) {
                $location.path('/app/calendar');
              } else {
                $location.path('/app/events');
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

  .state('login', {
     url: '/login',
     templateUrl: 'templates/login.html',
     controller : 'LoginCtrl'
   })

  .state('app', {
    url: '/app',
    abstract: true,
    controller: 'MenuCtrl',
    templateUrl: 'templates/menu.html'
  })

  .state('app.calendar', {
    url: '/calendar',
    params:{
      selectedEvent: null
    },
    views: {
      'menuContent': {
        templateUrl: 'templates/rcalendar.html',
        controller: 'CalendarCtrl'
      }
    }
  })
  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent': {
        templateUrl: 'templates/user_profile.html',
        controller: 'UserCtrl'
      }
    }
  })

  .state('app.events', {
    url: '/events',
    views: {
      'menuContent': {
        templateUrl: 'templates/events.html',
        controller: 'EventsCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
  $ionicConfigProvider.scrolling.jsScrolling(false);
});
