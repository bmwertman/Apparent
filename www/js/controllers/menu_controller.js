Pta.controller('MenuCtrl', [
  '$scope',
  'Auth',
  '$state',
  'userService',
  '$ionicPlatform',
  function($scope, Auth, $state, userService, $ionicPlatform) {
    $scope.logout = function(){
      Auth.logout();
    }
    $scope.goHome = function(){
      $state.go('app.home');
    }
    $scope.user = userService.getUser();

    $ionicPlatform.onHardwareBackButton(function(){
      $state.go('app.home');
    });

}]);


