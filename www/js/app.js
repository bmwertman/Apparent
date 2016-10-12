var Pta = angular.module('pta', [
  'ionic', 
  'swipe', 
  'ngCordova', 
  'ngAria', 
  'ngMaterial', 
  'ngMaterialDatePicker',
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
  'ui.router.stateHelper',
  'ionicLazyLoad',
  'monospaced.elastic',
  // 'ngCordovaOauth',
  angularDragula(angular)
  ])
// .constant('applicationId', '125323192420')
// .constant('gapiApiKey', 'AIzaSyCi2ojTUERxZyYdfpgQOTdVNKAKAZtkwU0')
// .constant('gapiClientId', '125323192420-c2nscbgoel9d0m7jv400dcfhfmtomac2.apps.googleusercontent.com')
.run(function($ionicPlatform, $rootScope, Auth, editableThemes, editableOptions, $localstorage, $http, $state, $compile, userService, $q, $window) {
  // Drive integration back-burnered 10-7-2016
  // var googleApi = $q.defer(),
  //     apis = []
  //     loadApis = {'drive': 'v3'};
      
  // $window.gapi.client.setApiKey();

  // angular.forEach(loadApis, function (value, key) {
  //   apis.push($q.when(gapi.client.load(key, value)));
  // });
  // $q.all(apis).then(function () {
  //   googleApi.resolve($window.gapi);
  // });

  // $rootScope.googleApi = googleApi.promise;

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
    Register a push notification listener
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
    Auth.onAuth();
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
              } else {
                $rootScope.isAdmin = false;
              }
              function adminReset(){
                if($rootScope.isAdmin){
                  $rootScope.isAdmin = false;
                } else {
                  $rootScope.isAdmin = true;
                }
              }
              userIsAdmin.$watch(adminReset);
              $state.go('app.home');
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

.config([
  'stateHelperProvider',
  '$urlRouterProvider',
  '$ionicConfigProvider',
  '$cordovaInAppBrowserProvider',
  'msdElasticConfig',
  function(stateHelperProvider, $urlRouterProvider, $ionicConfigProvider, $cordovaInAppBrowserProvider, msdElasticConfig) {
  
  stateHelperProvider

  .state({
    name: 'app',
    url: '/app',
    abstract: true,
    cache: false,
    templateUrl: 'templates/menu.html',
    controller: 'MenuCtrl',
    children: [
      {
        name: 'home', 
        url: '/home',
        templateUrl: 'templates/landing.html',
        controller: 'HomeCtrl',
      },{
        name: 'board',
        url: '/board',
        templateUrl: 'templates/pta-board.html',
        controller: 'BoardCtrl' 
      },{
        name: 'events',
        url: '/events',
        templateUrl: 'templates/events.html',
        controller: 'EventsCtrl'
      },{
        name: 'calendar',
        url: '/calendar',
        params:{
          selectedEvent: null,
          calendarTitle: 'Volunteer',
          isVolunteerSignup: true
        },
        templateUrl: 'templates/rcalendar.html',
        controller: 'CalendarCtrl'
      },{
        name: 'rooms',
        url: '/chat-rooms',
        templateUrl: 'templates/chat-rooms.html',
        controller: 'RoomsCtrl'
      },{
        name: 'room',
        url: '/room',
        params:{
          roomId: null,
          chatters: null
        },
        templateUrl: 'templates/chat-room.html',
        controller: 'ChatCtrl'
      },{
        name: 'parents',
        url: '/parents',
        templateUrl: 'templates/parent-directory.html',
        controller: 'ParentCtrl'
      },{
        name: 'profile',
        url: '/profile',
        params:{
          isNewUser: null
        },
        templateUrl: 'templates/user_profile.html',
        controller: 'UserCtrl'
      },{
        name: 'admin',
        url: '/admin',
        abstract: true,
        cache: false,
        template: '<ion-nav-view></ion-nav-view>',
        children:[
          {
            name: 'calendar',
            url: '/calendar',
            params:{
              selectedEvent: null,
              calendarTitle: 'Calendar',
              isVolunteerSignup: true
            },
            templateUrl: 'templates/rcalendar.html',
            controller: 'CalendarCtrl'
          },{
            name:'addevent',
            url:'/event/add',
            params:{
              newEvent: null
            },
            templateUrl: 'templates/add_event.html',
            controller: 'AddEventCtrl'
          },{
            name: 'volunteers',
            url: '/volunteers',
            params:{
              thisHoursVolunteers: null,
              thisEvent: null
            },
            templateUrl: 'templates/admin-interact.html',
            controller: 'VolunteerCtrl'
          },{
            name: 'roles',
            url: '/roles',
            templateUrl: 'templates/roles.html',
            controller: 'RoleCtrl'
          },{
            name: 'settings',
            url: '/settings',
            templateUrl: 'templates/settings.html',
            controller: 'SettingsCtrl'
          },{
            name: 'contact',
            url: '/contact_us',
            templateUrl: 'templates/contact_us.html',
            controller: 'ContactCtrl'
          }
        ]
      }
    ]
  })
  .state({
    name: 'login', 
    url: '/login',
    templateUrl: 'templates/login.html',
    controller : 'LoginCtrl'
  })
  .state({
    name: 'signup',
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller : 'SignupCtrl' 
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
  $ionicConfigProvider.backButton.previousTitleText(false);
  $ionicConfigProvider.scrolling.jsScrolling(false);

  msdElasticConfig.append = '\n';

  //Google Drive Integration back-burnered
  //inAppBrowser options
  // $cordovaInAppBrowserProvider.setDefaultOptions({
  //   location: 'no',
  //   zoom: 'no',
  //   hardwareback: 'no',
  //   clearsessioncache: 'yes',
  //   clearcache: 'yes'
  // });
}]);
