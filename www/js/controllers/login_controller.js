Pta.controller('LoginCtrl', function($scope, $state, $meteor) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.doLoginAction = function($scope) {
     alert("in doLoginAction");
     setTimeout(function() {
       $state.go('home');
     }, 1000);
   }

   $scope.doCreateAccountAction = function() {
     alert("in doCreateAccountAction");
     $meteor.createUser({
       username: $scope.credentials.username,
       email: $scope.credentials.username,
       password: $scope.credentials.password,
       profile: {
         createdOn: new Date()
       }
     }).then(function(_response) {
       console.log('doCreateAccountAction success');
       alert("user created: " + $scope.credentials.username );
       $state.go('home');
     }, function(_error) {
       console.log('Login error - ', _error);
       alert("Error: " + _error.reason);
     });
     return false;
   }

});