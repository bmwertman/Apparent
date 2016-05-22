Pta.controller('SignupCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  'FIREBASE_URL',
  '$firebaseAuth',
  '$ionicLoading',
  '$firebaseArray',
  function($scope, $ionicSideMenuDelegate, $ionicModal, FIREBASE_URL, $firebaseAuth, $ionicLoading, $firebaseArray) {

  $ionicSideMenuDelegate.canDragContent(true);
  $scope.childCntRcvd = false;
  $scope.user = {};
  $scope.user.children = {};
  $scope.child_name = [];
  $scope.child_grade = [];
  $scope.grades = {
    'K': 0,
    '1st': 1,
    '2nd': 2,
    '3rd': 3,
    '4th': 4,
    '5th': 5,
    '6th': 6,
    '7th': 7,
    '8th': 8,
    '9th': 9,
    '10th': 10,
    '11th': 11,
    '12th': 12
  };
  var ref = new Firebase(FIREBASE_URL);
  $scope.authObj = $firebaseAuth(ref);

  $scope.childInfoInputs = function(num){
    $scope.childArr = [];
    for (var i = 0; i < num; i++) {
      $scope.childArr.push(i);
    }
    $scope.childCntRcvd = true;
  }

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
    $scope.authObj.$createUser({
      email: $scope.user.user_email,
      password: $scope.user.password
    }).then(function(userData) {
      // Log in this newly created user
      return $scope.authObj.$authWithPassword({
        email: $scope.user.user_email,
        password: $scope.user.password
      });
    }).then(function(authData) {
      // If the user is now created and logged in, then add the user's
      // info into firebase
      // Add the unique ID firebase assigns to the user (this will be helpful 
      // as you build out more features)
      var userProfile = { school: $scope.user.school,
                          children: $scope.user.children,//an object with enumerable properties 
                                                         //representing the # of children a user 
                                                         //has at the school.
                          email: $scope.user.user_email,
                          user_id: authData.uid,
                          isAdmin: false 
                        },
          usersRef = ref.child('users').child(authData.uid);
      // Write the signup data in firebase under "users" with the key being
      // the unique ID firebase assigned this user
      usersRef.update(userProfile);
      $ionicLoading.hide();
      $scope.closeModal();
    }).catch(function(error) {
      console.error("Error: ", error);
      $scope.errorMessage = error.message;
    });
  };
}]);


