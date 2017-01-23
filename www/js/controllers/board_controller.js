Pta.controller('BoardCtrl', [
  '$scope',
  '$firebaseArray',
  'userService',
  '$firebaseObject',
  '$state',
  'Rooms',
  '$filter',
  function ($scope, $firebaseArray, userService, $firebaseObject, $state, Rooms, $filter) {
        
    var user = userService.getUser(),
        ref = firebase.database().ref(),
        userRoomsRef = firebase.database().ref('user-rooms').child(user.user_id),
        userRooms = $firebaseArray(userRoomsRef),
        users = firebase.database().ref('users'),
        school = $firebaseArray(users.orderByChild('school').equalTo(user.school));
    school.$loaded()
    .then(function(schoolParents){
        $scope.boardmembers = $filter('filter')(schoolParents, {isAdmin: true});
    });
    
    $scope.currentUser = user;

    $scope.openChatRoom = function (boardmemberId) {
      if(user.user_id !== boardmemberId){
        $firebaseObject(ref.child('users').child(boardmemberId))
        .$loaded()
        .then(function(user){
          $scope.chatter = user
        });
        var roomId = user.user_id + boardmemberId,
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