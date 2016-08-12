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
  'ngImgCrop',
  'naif.base64',
  'firebase',
  'angularMoment',
  'ngStorage',
  'angular-svg-round-progress',
  'ionic-cache-src',
  angularDragula(angular)
  ])
.run(function($ionicPlatform, $rootScope, Auth, editableThemes, editableOptions, $localstorage, $firebaseAuth) {
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

  $rootScope.$on('$stateChangeSuccess', function(){
    if($rootScope.subject){
      delete $rootScope.subject;
    }
  }); 

  $rootScope.$on('subject', function(e, subject){
    $rootScope.subject = subject;
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
  
  var loginEmail = $localstorage.get('email'),
      loginPassword = $localstorage.get('password');

  if (loginEmail && loginPassword) {
    $firebaseAuth().$signInWithEmailAndPassword(loginEmail, loginPassword,
      function(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
        } else {
          Auth.onAuth()
        }
    });
  }
})
// Watches for authentication event. If login occurs, then get the user's profile info and go to calender or volunteer page
.factory('Auth', function($firebaseAuth, $timeout, $rootScope, $firebaseObject, $state, userService){
  return {
    // helper method to login with multiple providers
    loginWithProvider: function loginWithProvider(provider) {
      return $firebaseAuth().$signInWithPopup(provider);
    },
    // wrapping the unauth function
    logout: function logout() {
      $firebaseAuth().$signOut();
    },
    // Watch for an authentication event
    onAuth: function onLoggedIn(callback) {
      $firebaseAuth().$onAuthStateChanged(function(authData) {
        // If user is successfully authenticated, then get their profile
        if (authData) {
          var ref = firebase.database().ref();
          var userID = authData.uid;
          var profileObjectRef = ref.child('users').child(userID);
          $rootScope.profile = $firebaseObject(profileObjectRef);
          userService.setUser($firebaseObject(profileObjectRef));
          $rootScope.profile.$loaded(
            function(data) {
              // After user's profile data is loaded, go to calender or volunteer page
              // depending of if they are an admin or not
              if (data.isAdmin) {
                $state.go('app.calendar');
              } else {
                $state.go('app.events');
              }
            }
          );
        } else {
          // If the user is not successfully authenticated, go back to login page
          $rootScope.profile = null;
          $state.go('login');
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

  .state('signup', {
     url: '/signup',
     templateUrl: 'templates/signup.html',
     controller : 'SignupCtrl'
   })

  .state('app', {
    url: '/app',
    abstract: true,
    controller: 'MenuCtrl',
    templateUrl: 'templates/menu.html'
  })

  .state('app.rooms', {
    url: '/rooms',
    views: {
      'menuContent': {
        templateUrl: 'templates/chat-rooms.html',
        controller: 'RoomsCtrl'
      }
    }
  })

  .state('app.rooms.chat', {
    url: '/chat',
    params:{
      roomId: null
    },
    views: {
      'menuContent@app': {
        templateUrl: 'templates/chat-room.html',
        controller: 'ChatCtrl'
      }
    }
  })

  .state('app.roles', {
    url: '/roles',
    views: {
      'menuContent': {
        templateUrl: 'templates/roles.html',
        controller: 'RoleCtrl'
      }
    }
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

  .state('app.calendar.volunteers', {
    url: '/volunteers',
    params:{
      thisHoursVolunteers: null,
      thisEvent: null
    },
    views: {
      'menuContent@app': {
        templateUrl: 'templates/admin-interact.html',
        controller: 'VolunteerCtrl'
      }
    }
  })

  .state('app.profile', {
    url: '/profile',
    params:{
      isNewUser: null
    },
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
