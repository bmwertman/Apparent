Pta.controller('ParentCtrl', [
  '$scope',
  'userService',
  '$state',
  'userFilter',
  '$firebaseArray',
  '$cordovaEmailComposer',
  'Rooms',
  function($scope, userService, $state, userFilter, $firebaseArray, $cordovaEmailComposer, Rooms) {
    var user = userService.getUser(),
        users = firebase.database().ref('users'),
        userRoomsRef = firebase.database().ref('user-rooms').child(user.$id),
        userRooms = $firebaseArray(userRoomsRef);
        school = $firebaseArray(users.orderByChild('school').equalTo(user.school));
    school.$loaded()
    .then(function(schoolParents){
        $scope.schoolParents = schoolParents;
        $scope.filterParents();
    });

    $scope.filterParents = function(){
      $scope.parents = userFilter($scope.schoolParents, $scope.search);
    }

    $scope.childWidth = function(children){
      if(children.length > 1){
        return "40%";
      } else {
        return "90%";
      }
    }

    $scope.childMarginTop = function(children){
      if(children.length <= 2){
        return "27px";
      } else {
        return "0";
      }
    }

    $scope.call = function(number){
      if(number){
        window.plugins.CallNumber.callNumber(
          function(res){
            console.log(res);
          },
          function(err){
            console.log(err);
          }, number);
      }
    }

    $scope.email = function(address){
      $cordovaEmailComposer.open({to: address})
      .then(null,
        function(){
          console.log("cancelled");
      });
    }

    $scope.openChatRoom = function (chatter) {
      var roomId = user.$id + chatter.$id;
          chattersArr = [];
          id;
      if(userRooms.$indexFor(roomId) >= 0){
        id = roomId;
      } else {
        chattersArr.push(chatter);
        var id = Rooms.addNewRoom(chattersArr, '/user-rooms/', roomId);
      }
      $state.go('app.room', { roomId: id });
    }
}]);


