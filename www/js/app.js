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
  'angular-toArrayFilter',
  'ngStorage',
  'angular-svg-round-progress',
  'ionic-cache-src',
  angularDragula(angular)
  ])
.run(function($ionicPlatform, $rootScope, Auth, editableThemes, editableOptions, $localstorage, $http, $state, $compile, userService) {
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

    $rootScope.goToChat = function(e, chatState, chatRmId){
      angular.element(e.currentTarget).remove();
      $state.go(chatState, {roomId: chatRmId});
    }

    $rootScope.$on('chatter-bag.drop', function(e, el){
      var index = $rootScope.queuedChatters.map(function(chatter){
        return chatter.sender_imgUrl;
      }).indexOf(el.sender_imgUrl);
      $rootScope.queuedChatters.splice(index, 1);
      $rootScope.removeDrawer.css('bottom', '-80px');
    });

    $rootScope.$on('chatter-bag.drag', function(e, el){
      $rootScope.removeDrawer.css('bottom', '0px');
    });

    $rootScope.$on('chatter-bag.cancel', function(e, el){
      $rootScope.removeDrawer.css('bottom', '-80px');
    });

    $rootScope.queuedChatters = [];
    // Register a push notification listener
    FCMPlugin.onNotification(
      function(data){
        if(!data.wasTapped && data.sender_imgUrl !== userService.getUser().pic){// Make sure the user isn't getting notified about their own message
          //Notification was received in foreground. Check if the user is already in the room
          if(!$state.is(data.state, { roomId: data.roomId })){
            var queue = document.getElementById('queue');
            if(!queue){ // This is the first queued chatter
              var body = angular.element(document.getElementsByTagName('body')[0]),
                  messageCount = angular.element(document.createElement('span')),
                  imgTag = angular.element(document.createElement('img')),
                  remove = angular.element(document.createElement('div')),
                  iconBackground = angular.element(document.createElement('div')),
                  queue = angular.element(document.createElement('div'));
              imgTag.attr({
                'ng-repeat':'chatter in queuedChatters track by $index',
                src: data.sender_imgUrl,
                'dragula-model':'queuedChatters',
                class: 'chat-notification',
                'ng-click': 'goToChat($event, chatter.state, chatter.roomId)'
              });
              remove.attr({ 
                id:'remove-notification',
                dragula: '"chatter-bag"',
                'dragula-model': 'removeBag'
              });
              iconBackground.attr({ class: 'icon-background icon ion-close-circled' });
              remove.append(iconBackground);
              queue.attr({
                id: 'queue',
                dragula: '"chatter-bag"',
                'dragula-model': 'queueBag'
              });
              queue.append(imgTag);
              body.append(queue);
              body.append(remove);
              $compile(queue)($rootScope);
              $compile(remove)($rootScope);
              $rootScope.removeDrawer = angular.element(document.getElementById('remove-notification'));
            }
            if($rootScope.queuedChatters.length > 0){
              for (var i = $rootScope.queuedChatters.length - 1; i >= 0; i--) {
                value = $rootScope.queuedChatters[i];
                // If it isn't the same person in the same room sending another message, add them
                if(value.roomId !== data.roomId && value.sender_imgUrl !== data.sender_imgUrl && i === 0){
                  $rootScope.queuedChatters.push(data);
                }
              }
            } else {
              $rootScope.queuedChatters.push(data);
            }
            $rootScope.$apply();
          } 
        } else {
          //Notification was received on device tray and tapped by the user.
          $localstorage.setObject('pushNotification', data);
        }
      });

    $ionicPlatform.on('resume', function(){
      if($localstorage.getObject('pushNotification')){
        var data = $localstorage.getObject('pushNotification');
        $state.go(data.state, {roomId: data.roomId});
        $localstorage.remove('pushNotification');
      }
    });
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
  
  var credentials = {
    email: $localstorage.get('email'),
    password: $localstorage.get('password')
  };

  if (credentials.email && credentials.password) {
    Auth.login(credentials);
  }
})
// Watches for authentication event. If login occurs, then get the user's profile info and go to calender or volunteer page
.factory('Auth', function($firebaseAuth, $firebaseObject, $state, userService, $localstorage, $rootScope, $timeout, $ionicLoading){
  var authObj = $firebaseAuth();
  return {
    login: function(credentials) {
      var self = this;
      authObj.$signInWithEmailAndPassword(credentials.email, credentials.password)
      .then(function(authData){
        if(ionic.Platform.isAndroid() || ionic.Platform.isIOS()){
          $localstorage.set('email', credentials.email);
          $localstorage.set('password', credentials.password);
        }
        if(navigator.splashscreen){
          self.onAuth(navigator.splashscreen.hide); 
        } else {
          self.onAuth($ionicLoading.hide);
        }
      }).catch(function(error){
        $ionicLoading.hide();
        return error.message;
      });
    },
    logout: function() {
      $localstorage.remove('email');
      $localstorage.remove('password');
      authObj.$signOut();
    },
    onAuth: function(callback) {
      authObj.$onAuthStateChanged(function(authData) {
        if (authData) {
          var userRef = firebase.database().ref('users').child(authData.uid),
              profile = $firebaseObject(userRef),
              userIsAdmin = $firebaseObject(userRef.child('isAdmin'));
          profile.$loaded(
            function(profile) {
              userService.setUser(profile);
              if(callback){
                $timeout(function(){
                  callback();
                }, 2000);
              }
              if (profile.isAdmin) {
                $rootScope.isAdmin = true;
                $state.go('app.calendar');
              } else {
                $rootScope.isAdmin = false;
                $state.go('app.events');
              }
              function adminReset(){
                if($rootScope.isAdmin){
                  $rootScope.isAdmin = false;
                  $state.go('app.events');
                } else {
                  $rootScope.isAdmin = true;
                  $state.go('app.calendar');
                }
              }
              userIsAdmin.$watch(adminReset);
            }
          );
        } else {
          $state.go('login');
        }       
      });
    },
    createUser: function(email, password){
      authObj.$createUserWithEmailAndPassword(email, password)
    },
    passwordReset: function(email){
      authObj.$sendPasswordResetEmail(email);
    }
  }
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    controller: 'MenuCtrl',
    templateUrl: 'templates/menu.html'
  })

  .state('app.board', {
    url: '/board',
    views: {
      'menuContent':{
        templateUrl: 'templates/pta-board.html',
        controller: 'BoardCtrl'
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

  .state('app.roles', {
    url: '/roles',
    views: {
      'menuContent': {
        templateUrl: 'templates/roles.html',
        controller: 'RoleCtrl'
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
      roomId: null,
      chatters: null
    },
    views: {
      'menuContent@app': {
        templateUrl: 'templates/chat-room.html',
        controller: 'ChatCtrl'
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

  .state('login', {
     url: '/login',
     templateUrl: 'templates/login.html',
     controller : 'LoginCtrl'
   })

  .state('signup', {
     url: '/signup',
     templateUrl: 'templates/signup.html',
     controller : 'SignupCtrl'
   });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
  $ionicConfigProvider.scrolling.jsScrolling(false);
});
