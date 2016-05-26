Pta.controller('MenuCtrl', [
  '$scope',
  '$rootScope',
  function($scope, $rootScope) {
    if($rootScope.profile.isAdmin){
        $scope.isAdmin = true;
    } else {
        $scope.isAdmin = false;
    }
}]);


