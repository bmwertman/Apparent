Pta.controller('BoardCtrl', [
  '$scope',
  '$firebaseArray',
  'userService',
  '$firebaseObject',
  function ($scope, $firebaseArray, userService, $firebaseObject) {
    var user = userService.getUser(),
        boardmembers = firebase.database().ref('roles').child(user.school),
        school = $firebaseObject(firebase.database().ref('schools').child(user.school));
    school.$loaded(function(userSchool){
      $scope.school = userSchool;
    });
    $firebaseArray(boardmembers)
    .$loaded()
    .then(function(boardmembers){
      $scope.boardmembers = boardmembers;
    });
}]);