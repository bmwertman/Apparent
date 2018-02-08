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
   'Answers',
   '$q',
  function($firebaseAuth, $firebaseObject, $state, userService, $localstorage, $rootScope, $timeout, $ionicLoading, Answers, $q){
  var authObj = $firebaseAuth();

  return {
    login: function(credentials, state, roomId) {
      var self = this;
      var defer = $q.defer();
      self.onAuth();
      defer.resolve(authObj.$signInWithEmailAndPassword(credentials.email, credentials.password)
      .then(function(authData){
        if (!firebase.auth().currentUser.emailVerified) {
          self.logout();
        }
        $localstorage.set('email', credentials.email);
        $localstorage.set('password', credentials.password);
        if($localstorage.get('loggedOut')){
          $localstorage.set('loggedOut', false);
          $state.go('app.home');
        }
        Answers.sendLogin('Email', true);
        return {code: 'Sign in success'}
      }).catch(function(error){
        if(!error.code === "auth/wrong-password"){
          Answers.sendLogin('Email', false, error);
        }
        $ionicLoading.hide();
        return error;
      }));
      return defer.promise;
    },
    logout: function() {
      $localstorage.remove('email');
      $localstorage.remove('password');
      $localstorage.set('loggedOut', true);
      authObj.$signOut();
    },
    onAuth: function() {
      authObj.$onAuthStateChanged(function(authData) {
        $rootScope.$on('$stateChangeSuccess', function(){
          if (navigator.splashscreen) {
            $timeout(function(){
              navigator.splashscreen.hide();
            });
          }
        });

        if (authData) {
          var userRef = firebase.database().ref('users').child(authData.uid),
              userIsAdmin = $firebaseObject(userRef.child('isAdmin'));
          
          userRef.once("value")
          .then(function(profile){
            userService.setUser(profile.val());
            if (profile.val().isAdmin) {
              $rootScope.isAdmin = true;
            } else {
              $rootScope.isAdmin = false;
            }

            userIsAdmin.$bindTo($rootScope, "isAdmin");

            if (!profile.val().school) {
              $state.go('app.profile');
            } else {
              $state.go('app.home');
            }

            Answers.sendLogin('Email', true);
          });
        } else if ($localstorage.get('loggedOut')) {
          $state.go('login');
        } else if ($localstorage.get('emailSent')) {
          $state.go('verify');
          authObj.$onAuthStateChanged(function(authData) {
            var user = firebase.auth().currentUser;
            if (user && user.emailVerified) {
              // $localstorage.remove('emailSent');
              $state.go('app.profile');
            }
          });
        } else {
          $state.go('signup');
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