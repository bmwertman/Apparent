Pta.controller('SignupCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  'Auth',
  '$ionicLoading',
  '$firebaseArray',
  '$state',
  function($scope, $ionicSideMenuDelegate, Auth, $ionicLoading, $firebaseArray, $state) {

  $ionicSideMenuDelegate.canDragContent(true);
  $scope.newUser = {};
  
  $scope.signupSubmit = function() {
    $ionicLoading.show({ template: '<ion-spinner></ion-spinner>', duration: 2000});
    // Create new user in firebase
    Auth.createUser($scope.newUser.email, $scope.newUser.password)
    .then(function(userData) {
      // Log in this newly created user
      return Auth.login($scope.newUser.email, $scope.newUser.password);
    }).then(function(authData) {
      // If the user is now created and logged in, then add the user's
      // info into firebase
      // Add the unique ID firebase assigns to the user (this will be helpful 
      // as you build out more features)
      var userProfile = { name: $scope.newUser.name,
                          email: $scope.newUser.email,
                          user_id: authData.uid,
                          isAdmin: false 
                        },
          ref = firebase.database().ref(),
          usersRef = ref.child('users').child(authData.uid);
      usersRef.update(userProfile);
      $ionicLoading.hide();
      $state.go('app.profile');
    }).catch(function(error) {
      console.error("Error: ", error);
      $scope.errorMessage = error.message;
    });
  };
}]);


