Pta.controller('HomeCtrl', [
  '$scope',
  'userService',
  '$firebaseObject',
  '$timeout',
  '$state',
  function($scope, userService, $firebaseObject, $timeout, $state) {
    $scope.user = userService.getUser();
    var school = $firebaseObject(firebase.database().ref('schools').child($scope.user.school));
    if(school){
      school.$loaded(function(school){
        $scope.school = school;
      });
    } else {
      var nameArr = $scope.user.name.split(' ');
      $scope.school.name = "Welcome " + nameArr[0];
    }

    $scope.goToState = function(state, delay, param) {
      $timeout(function () {
        $state.go(state, param);
      }, delay);
    }
}]);


