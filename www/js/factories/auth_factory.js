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
  function($firebaseAuth, $firebaseObject, $state, userService, $localstorage, $rootScope, $timeout, $ionicLoading){
  var authObj = $firebaseAuth();
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
              if(roomId){
                $state.go(state, {roomId: roomId});
              } else {
                $state.go('app.home');
              }
            }
          );
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