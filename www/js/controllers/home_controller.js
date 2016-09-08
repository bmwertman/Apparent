Pta.controller('HomeCtrl', [
  '$scope',
  'userService',
  '$firebaseObject',
  function($scope, userService, $firebaseObject) {
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

    if(school.logo){
      $scope.hasLogo = "has-tall-header";
    }
   
}]);


