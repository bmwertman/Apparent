Pta.controller('LoginCtrl', function($scope, $state, $meteor) {
  $scope.doLogoutAction = function() {
    $meteor.loginWithPassword($scope.credentials.username, $scope.credentials.password)
    .then(function() {
      console.log('Login success ');
      alert("logged in: " + $scope.credentials.username);
      $state.go('home');
    }, function(_error) {
      console.log('Login error - ', _error);
      alert("Error: " + _error.reason);
    });
    return false;
  }
  $scope.doLogoutAction = function() {
    $meteor.logout().then(function(_response) {
      $state.go('login');
    });
  };
});