Pta.controller('MenuCtrl', [
  '$scope',
  'Auth',
  function($scope, Auth) {
    $scope.logout = function(){
      Auth.logout();
    }
}]);


