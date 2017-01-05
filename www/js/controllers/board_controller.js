Pta.controller('BoardCtrl', [
  '$scope',
  '$firebaseArray',
  'userService',
  '$firebaseObject',
  '$state',
  'Rooms',
  function ($scope, $firebaseArray, userService, $firebaseObject, $state, Rooms) {
    var user = userService.getUser(),
        ref = firebase.database().ref(),
        boardmembers = ref.child('roles').child(user.school),
        school = $firebaseObject(ref.child('schools').child(user.school)),
        userRoomsRef = firebase.database().ref('user-rooms').child(user.$id),
        userRooms = $firebaseArray(userRoomsRef);
    school.$loaded(function(userSchool){
      $scope.school = userSchool;
    });
    $firebaseArray(boardmembers)
    .$loaded()
    .then(function(boardmembers){
      $scope.boardmembers = boardmembers;
    });

    $scope.openChatRoom = function (boardmemberId) {
      if(user.$id !== boardmemberId){
        $firebaseObject(ref.child('users').child(boardmemberId))
        .$loaded()
        .then(function(user){
          $scope.chatter = user
        });
        var roomId = user.$id + boardmemberId,
            chattersArr = [],
            id;
        if(userRooms.$indexFor(roomId) >= 0){
          id = roomId;
        } else {
          chattersArr.push($scope.chatter);
          var id = Rooms.addNewRoom(chattersArr, '/user-rooms/', roomId);
        }
        $state.go('app.room', { roomId: id });
      }
    }
   
}]);