Pta.controller('LoginCtrl', [
  '$scope',
  '$ionicModal',
  '$timeout',
  'FIREBASE_URL',
  '$ionicLoading',
  'Auth',
  '$localstorage',
  function($scope, $ionicModal, $timeout, FIREBASE_URL, $ionicLoading, Auth, $localstorage) {

  // Form data for the login modal
  $scope.loginData = {};

  // Look in Local Cache to see if user/password is stored
  var loginUsername = $localstorage.get('username');
  var loginPassword = $localstorage.get('password');
  if (loginUsername && loginPassword) {
    // $ionicLoading.show({ template: '<ion-spinner></ion-spinner>', duration: 3000 });
    loginPasswordCache(loginUsername, loginPassword);
  }

  // If username and password are found in local storage, then log in
  function loginPasswordCache(loginUsername, loginPassword) {
    var ref = new Firebase(FIREBASE_URL);
    ref.authWithPassword({
      email    : loginUsername,
      password : loginPassword
    }, function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      }
    });
  };

  // Log in using firebase's login API
  $scope.doLogin = function () {
    $scope.errorMessage = null;
    $ionicLoading.show({ template: '<ion-spinner></ion-spinner>'});
    var ref = new Firebase(FIREBASE_URL);
    ref.authWithPassword({
      email    : $scope.loginData.username,
      password : $scope.loginData.password
    }, function(error, authData) {
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
        $localstorage.set('username', $scope.loginData.username);
        $localstorage.set('password', $scope.loginData.password);
        console.log("Authenticated successfully with payload:", authData);
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
