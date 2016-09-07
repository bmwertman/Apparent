Pta.controller('BoardCtrl', [
  '$scope',
  '$firebaseArray',
  'userService',
  function ($scope, $firebaseArray, userService) {
    var user = userService.getUser(),
        boardmembers = firebase.database().ref('roles').child(user.school);
    $firebaseArray(boardmembers)
    .$loaded()
    .then(function(boardmembers){
      $scope.boardmembers = boardmembers;
    });
}]);