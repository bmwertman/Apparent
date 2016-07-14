Pta.controller('LoginCtrl', [
  '$scope',
  '$ionicModal',
  '$timeout',
  '$ionicLoading',
  'Auth',
  '$localstorage',
  '$firebaseAuth',
  function($scope, $ionicModal, $timeout, $ionicLoading, Auth, $localstorage, $firebaseAuth) {

  // Form data for the login modal
  $scope.credentials = {};

  // Look in Local Cache to see if user/password is stored
  var loginEmail = $localstorage.get('email');
  var loginPassword = $localstorage.get('password');
  if (loginEmail && loginPassword) {
    $ionicLoading.show({ template: '<ion-spinner></ion-spinner>', duration: 1000 });
    loginPasswordCache(loginEmail, loginPassword);
  }

  // If username and password are found in local storage, then log in
  function loginPasswordCache(loginEmail, loginPassword) {
    $firebaseAuth().$signInWithEmailAndPassword(loginEmail, loginPassword,
      function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      }
    });
  };

  // Log in using firebase's login API
  $scope.doLogin = function () {
    $scope.errorMessage = null;
    $ionicLoading.show({ template: '<ion-spinner></ion-spinner>'});
    var ref = firebase.database().ref();
    $firebaseAuth().$signInWithEmailAndPassword($scope.credentials.email, $scope.credentials.password,
      function(error, authData) {
      // $ionicLoading.hide();
      if (error) {
        $ionicLoading.hide();
        console.log("Login Failed!", error);
        $scope.errorMessage = error.message;
        $scope.$apply();
      } else {
        $ionicLoading.hide();
        // loginPopup.close();
        // cordova.plugins.Keyboard.close();
        // Save off login info into local storage
        //$ionicPlatform conditional is untested 
        //hoping it prevents storing signin information on non-mobile
        //web-based signins when this gets served as a website
        if(!ionic.Platform.isWebView()){
          $localstorage.set('email', $scope.credentials.email);
          $localstorage.set('password', $scope.credentials.password);
          $scope.credentials = {};
        } else {
          $scope.credentials = {};
        }
      }
    });
  };

  // Logs a user out
  $scope.logout = Auth.logout;

  // Detect changes in authentication state
  // when a user logs in, set them to $scope
  Auth.onAuth(function(authData) {
    $scope.user = authData;
  });

}]);