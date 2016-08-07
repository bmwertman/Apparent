Pta.controller('SignupCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  '$firebaseAuth',
  '$ionicLoading',
  '$firebaseArray',
  '$state',
  function($scope, $ionicSideMenuDelegate, $ionicModal, $firebaseAuth, $ionicLoading, $firebaseArray, $state) {

  $ionicSideMenuDelegate.canDragContent(true);
  $scope.user = {};
  
  $ionicModal.fromTemplateUrl('templates/signup.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.modal = modal;
  });

  $scope.openModal = function() {
    $scope.modal.show();
  };

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  
  $scope.signupSubmit = function() {
    $ionicLoading.show({ template: '<ion-spinner></ion-spinner>', duration: 2000});
    // Create new user in firebase
    $firebaseAuth().$createUserWithEmailAndPassword($scope.user.email, $scope.user.password)
    .then(function(userData) {
      // Log in this newly created user
      return $firebaseAuth().$signInWithEmailAndPassword($scope.user.email, $scope.user.password);
    }).then(function(authData) {
      // If the user is now created and logged in, then add the user's
      // info into firebase
      // Add the unique ID firebase assigns to the user (this will be helpful 
      // as you build out more features)
      var userProfile = { school: $scope.user.school,
                          children: $scope.user.children,//an object with enumerable properties 
                                                         //representing the # of children a user 
                                                         //has at the school.
                          email: $scope.user.email,
                          user_id: authData.uid,
                          isAdmin: false 
                        },
          ref = firebase.database().ref(),
          usersRef = ref.child('users').child(authData.uid);
      // Write the signup data in firebase under "users" with the key being
      // the unique ID firebase assigned this user
      usersRef.update(userProfile);
      $ionicLoading.hide();
      $scope.closeModal();
      $state.go('app.profile', {isNewUser: true});
    }).catch(function(error) {
      console.error("Error: ", error);
      $scope.errorMessage = error.message;
    });
  };
}]);


