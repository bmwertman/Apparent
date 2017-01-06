// Watches for authentication event. If login occurs, then get the user's profile info and go to calender or volunteer page
Pta.factory('Auth', [
  '$firebaseAuth',
   '$firebaseObject',
   '$state',
   'userService',
   '$localstorage',
   '$rootScope',
   '$timeout',
   '$ionicLoading',
   '$cordovaDevice',
  function($firebaseAuth, $firebaseObject, $state, userService, $localstorage, $rootScope, $timeout, $ionicLoading, $cordovaDevice){
  var authObj = $firebaseAuth(),
      device = $cordovaDevice.getDevice(),
      ref = firebase.database().ref(),
      devicesObj = $firebaseObject(ref.child('devices')),
      devicesRef = ref.child('devices');

  return {
    login: function(credentials, state, roomId) {
      var self = this;
      authObj.$signInWithEmailAndPassword(credentials.email, credentials.password)
      .then(function(authData){
        if(ionic.Platform.isAndroid() || ionic.Platform.isIOS()){
          $localstorage.set('email', credentials.email);
          $localstorage.set('password', credentials.password);
        }
        if(navigator.splashscreen){
          self.onAuth(navigator.splashscreen.hide, state, roomId); 
        } else {
          self.onAuth($ionicLoading.hide, state, roomId);
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
    onAuth: function(callback, state, roomId) {
      authObj.$onAuthStateChanged(function(authData) {
        if (authData) {
          var userRef = firebase.database().ref('users').child(authData.uid),
              userIsAdmin = $firebaseObject(userRef.child('isAdmin'));
          // Check if user is loggin in on a new device
          devicesRef.once('value', function(snapshot) {
            if (!snapshot.hasChild(device.uuid)) {
              devicesObj[device.uuid] = authData.uid;
              devicesObj.$save();
            }
          });
          userRef.once("value")
          .then(function(profile){
            userService.setUser(profile.val());
            if(callback){
              $timeout(function(){
                callback();
              }, 2000);
            }
            if (profile.val().isAdmin) {
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
            if(roomId){
              $state.go(state, {roomId: roomId});
            } else if(!profile.val().school){
              $state.go('app.profile');
            } else {
              $state.go('app.home');
            }
          });
        } else {
          $state.go('login');
        }       
      });
    },
    createUser: function(email, password){
      return authObj.$createUserWithEmailAndPassword(email, password);
    },
    passwordReset: function(email){
      authObj.$sendPasswordResetEmail(email);
    }
  }
}]);