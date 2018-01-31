Pta.controller('SignupCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  'Auth',
  '$ionicLoading',
  '$firebaseArray',
  '$state',
  'userService',
  '$localstorage',
  '$cordovaDevice',
  '$firebaseObject',
  '$timeout',
  'Answers',
  function($scope, $ionicSideMenuDelegate, Auth, $ionicLoading, $firebaseArray, $state, userService, $localstorage, $cordovaDevice, $firebaseObject, $timeout, Answers) {

  $ionicSideMenuDelegate.canDragContent(true);
  $scope.newUser = {};

  var email = $localstorage.get('email');
  
  if(navigator.splashscreen){
    $timeout(function(){
      navigator.splashscreen.hide(); 
    });
  }
  
  $scope.signupSubmit = function() {
    $scope.errorMessage = null;
    if($scope.newUser.password === $scope.newUser.confirm_password){
      Auth.createUser($scope.newUser.email, $scope.newUser.password)
      .then(function(authData) {
        var newUser = firebase.auth().currentUser;
        newUser.sendEmailVerification()
        .then(function(){
          $localstorage.set('emailSent', true);
          if(ionic.Platform.isAndroid() || ionic.Platform.isIOS()){
            $localstorage.set('email', $scope.newUser.email);
            $localstorage.set('password', $scope.newUser.password);
          }
          var userProfile = { name: $scope.newUser.name,
                              email: $scope.newUser.email,
                              user_id: authData.uid,
                              isAdmin: false 
                            },
              ref = firebase.database().ref(),
              usersRef = ref.child('users').child(authData.uid);
          usersRef.update(userProfile);
          userService.setUser(userProfile);
          $scope.newUser = {};

          Answers.sendSignup('Email', true);

          $state.go('verify');
        }, function(error){
          Answers.sendSignup('Email', false, error);
          console.log('Error: ' + error.message);
        });
      }).catch(function(error) {
        Answers.sendSignup('Email', false, error);
        console.error("Error: ", error);
        $scope.errorMessage = error.message;
      });
    } else {
      $scope.newUser.password = null;
      $scope.newUser.confirm_password = null;
    }
  };
}]);


