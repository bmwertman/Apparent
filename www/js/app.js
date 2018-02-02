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
.run([
  '$ionicPlatform',
  '$cordovaPushV5',
  '$rootScope',
  'Auth',
  'editableThemes',
  'editableOptions',
  '$localstorage',
  '$http',
  '$state',
  '$compile',
  '$cordovaDevice',
  '$ionicPopup',
  '$timeout',
  'userService',
  '$http',
  function($ionicPlatform, $cordovaPushV5, $rootScope, Auth, editableThemes, editableOptions, $localstorage, $http, $state, $compile, $cordovaDevice, $ionicPopup, $timeout, userService, $http) {
  // hide xeditable cancel button
  editableThemes['default'].cancelTpl = '<button type="button" class="btn btn-default" style="display:none">';
  editableThemes['default'].submitTpl = '<button type="submit" class="xeditable-submit fa fa-pencil-square-o"></button>';

  $ionicPlatform.ready(function() {

    var credentials = {
          email: $localstorage.get('email'),
          password: $localstorage.get('password')
        },
        platform,
        fbUser = JSON.parse($localstorage.get('firebase:authUser:AIzaSyCqFHdSGIab4VtdYra_H-EiDo4ovMTwlTk:[DEFAULT]'));
    
    // Only log the user in if they have verified their email
    if(fbUser.emailVerified && !$rootScope.notificationLaunch && credentials.email && credentials.password){
      Auth.login(credentials);
    } else if(!fbUser.emailVerified){
      $state.go('verify');
    }
    // codePush.sync();

    // function syncStatus(status){
    //   var pushRegId = $localstorage.get('registrationId');
    //   if(syncStatus.UPDATE_INSTALLED){
    //     $http({
    //        method: 'POST',
    //        url:'https://murmuring-fjord-75421.herokuapp.com/updates',
    //        data:{
    //            reg_id: pushRegId,
    //            topic: '/topics/' + platform,
    //            platform:  platform
    //        }
    //     })
    //     .catch(function(err){
    //         console.log("Node server POST error: " + err);
    //     });
    //   }
    // }
    
    $cordovaPushV5.initialize({
      "android": {
          "senderID": "165149993214"
      },
      "ios": {
          "senderID": "165149993214",
          "alert": true,
          "sound": true, 
          "vibration": true,
          "badge": true,
          "gcmSandbox": "true"
      }
    })
    .then(function(push){
      $cordovaPushV5.Push = push;
      $cordovaPushV5.onNotification();
      $cordovaPushV5.onError();
      $cordovaPushV5.register()
      .then(function(regId){
        var oldRegId = $localstorage.get('registrationId');
        if (oldRegId !== regId) {
          // Save new registration ID
          $localstorage.set('registrationId', regId);
          // Post registrationId to your app server as the value has changed
        }

        // function updatesSubcribe(platform){
        //   $cordovaPushV5.Push.subscribe(platform, 
        //     function(success){
        //       console.log('success: ', success);
        //   },
        //   function(err){
        //     console.log('Error: ', err);
        //   });
        // }
        
        // if(ionic.Platform.isAndroid() && firebase.app().options.authDomain === "apparent-2a054.firebaseapp.com"){
        //   platform = "android";
        //   // updatesSubcribe(platform);
        //   $ionicPlatform.on('resume', function(){
        //     codePush.sync(syncStatus, {installMode: InstallMode.IMMEDIATE}); // check for updates
        //     if(firebase.auth().currentUser && !firebase.auth().currentUser.emailVerified){
        //       navigator.app.loadUrl("file:///android_asset/www/index.html");
        //     }
        //   });
        // } else if(firebase.app().options.authDomain === "apparent-2a054.firebaseapp.com"){
        //   platform = "ios";
        //   // updatesSubcribe(platform);
        //   document.addEventListener('active', function(){
        //     codePush.sync(syncStatus, {installMode: InstallMode.IMMEDIATE}); // check for updates
        //     if(firebase.auth().currentUser && !firebase.auth().currentUser.emailVerified){
        //       navigator.splashscreen.show();
        //       window.location.reload();
        //     }
        //   });
        // }
      });
    });

    $rootScope.queuedChatters = [];
    $rootScope.goToChat = function(e, chatState, chatRmId){
      var chatterIndex = $rootScope.queuedChatters.map(function(e){
        return e.sender_imgUrl;
      })[0].indexOf(e.currentTarget.src);
      $rootScope.queuedChatters.splice(chatterIndex, 1);
      angular.element(e.currentTarget).remove();
      $state.go(chatState, {roomId: chatRmId});
    };

    $rootScope.notificationLaunch = false;
    var device = $cordovaDevice.getDevice();
    window.inlineReply = function(data){
      if(parseFloat(device.version) < 7) { // Assumes Android OS
        $rootScope.notificationLaunch = true;
        Auth.onAuth();
        Auth.login(credentials, data.additionalData.state, data.additionalData.roomId);// We're using inline reply for chat
      } 
    };

    // triggered every time notification received
    $rootScope.$on('$cordovaPushV5:notificationReceived',function(event, notification){
      var data = notification.additionalData;
      var user = userService.getUser();
      if(data.sender_imgUrl !== user.pic && data.foreground){// Make sure the user isn't getting notified about their own message
        //Notification was received in foreground. Check if the user is already in the room
        if($rootScope.toParams === null || $rootScope.toParams.roomId !== data.roomId){
          var queue = document.getElementById('queue'),
              imgTag = angular.element(document.createElement('img')),
              divTag = angular.element(document.createElement('div')),
              chatterIcon = angular.element(document.createElement('div')),
              body = angular.element(document.getElementsByTagName('body')[0]);
              // messageCount = angular.element(document.createElement('span'));
          if(!queue){ // This is the first queued chatter
            var remove = angular.element(document.createElement('div')),
            iconBackground = angular.element(document.createElement('div'));
            queue = angular.element(document.createElement('div'));
            queue.attr({
              id: 'queue',
              dragula: '"chatter-bag"',
              'dragula-model': 'queueBag'
            });
            remove.attr({ 
              id:'remove-notification',
              dragula: '"chatter-bag"',
              'dragula-model': 'removeBag'
            });
            iconBackground.attr({ class: 'icon-background icon ion-close-circled' });
            imgTag.attr({
              'ng-if': "chatter.sender_imgUrl.length > 1",
              src: data.sender_imgUrl,
              class: 'chat-notification'
            });
            divTag.html(data.sender_imgUrl);
            divTag.attr({
              'ng-if': "chatter.sender_imgUrl.length === 1",
              class: 'chat-notification initial'
            });
            chatterIcon.attr({
              'style': "display:inline-block;",
              'dragula-model':'queuedChatters',
              'ng-repeat':"chatter in queuedChatters track by $index",
              'ng-click': 'goToChat($event, chatter.state, chatter.roomId)'
            });
            chatterIcon.append(imgTag);
            chatterIcon.append(divTag);
            queue.append(chatterIcon);
            body.append(queue);
            remove.append(iconBackground);
            body.append(remove);
            $compile(queue)($rootScope);
            $compile(remove)($rootScope);
            $rootScope.removeDrawer = angular.element(document.getElementById('remove-notification'));
          } else {
            queue = angular.element(document.getElementById('queue'));
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
          if(!$rootScope.$$phase){
            $rootScope.$apply();
          }    
        } 
      } else if(data.state === "app.updates"){
        $state.go(data.state);
      } else {
        //Notification was received on device tray and tapped by the user.
        $state.go(data.state, {roomId: data.roomId});
      }
      $cordovaPushV5.Push.finish();
    }); 
    
    // triggered every time error occurs
    $rootScope.$on('$cordovaPushV5:errorOcurred', function(event, e){
      console.log('$cordovaPushV5 error: ', e.message);
    });

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    ionic.Platform.fullScreen();

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
      return StatusBar.hide();
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

  });

  
  $rootScope.goHome = function(){
    var user = userService.getUser();
    if(user.school && $state.current.name !== 'app.room'){
      $state.go('app.home');
    } else if($state.current.name !== 'app.room'){
      var addYourSchool = $ionicPopup.alert({
        title: 'A school is required', // String. The title of the popup.
        cssClass: 'add-school',
        subTitle: 'In order to provide relevant news and connections.',
        template: '<p>Please add your child\'s school to continue.</p>',
        okType: 'button-balanced'
      });
      cordova.plugins.Keyboard.close();
      addYourSchool;
    } else {
      $rootScope.$broadcast("comeHome");
      $state.go('app.rooms');
    }
  };

  $rootScope.logout = function() {
    Auth.logout(); 
  };

  $rootScope.$on('$stateChangeSuccess', function(){
    if($rootScope.subject){
      delete $rootScope.subject;
    }
  });

  $rootScope.$on('$stateChangeStart', function(e, toState, toParams){
    if(toState.name === 'app.room'){
      $rootScope.toParams = toParams;
    } else {
      $rootScope.toParams = null;
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
}])
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
    name:'verify',
    url:'verify-email',
    templateUrl: 'templates/verify-email.html',
    controller: 'EmailVerifyCtrl'
  })
  .state({
    name: 'signup',
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller : 'SignupCtrl' 
  })
  .state({
    name: 'updates',
    url: '/updates',
    templateUrl: 'templates/updates.html',
    controller: 'UpdatesCtrl'
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/signup');
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
