Pta.controller('HomeCtrl', [
  '$scope',
  'userService',
  '$firebaseObject',
  '$timeout',
  '$state',
  '$ionicNavBarDelegate',
  function($scope, userService, $firebaseObject, $timeout, $state, $ionicNavBarDelegate) {
    
    $ionicNavBarDelegate.align('center');

    window.screen.lockOrientation('portrait');

    $scope.user = userService.getUser();
    if($scope.user.school){
      var school = $firebaseObject(firebase.database().ref('schools').child($scope.user.school));
      school.$loaded(function(school){
        $scope.school = school;
      });
    } else {
      var nameArr = $scope.user.name.split(' ');
      $scope.school = {};
      $scope.school.name = "Welcome " + nameArr[0];
    }
}]);


