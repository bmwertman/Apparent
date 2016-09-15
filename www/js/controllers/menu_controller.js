Pta.controller('MenuCtrl', [
  '$scope',
  'Auth',
  '$state',
  function($scope, Auth, $state) {
    $scope.logout = function(){
      Auth.logout();
    }
    $scope.goBack = function(){
      $state.go('app.home');
    }
}]);


