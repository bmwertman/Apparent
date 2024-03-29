Pta.controller('RoomsCtrl', [
  '$scope',
  'Rooms',
  '$state',
  '$ionicModal',
  'userService',
  '$firebaseObject',
  '$ionicPopup',
  '$filter',
  '$q',
  function ($scope, Rooms, $state, $ionicModal, userService, $firebaseObject, $ionicPopup, $filter, $q) {
  var userRooms = Rooms.all();

  $scope.user = userService.getUser();
  $scope.school = $firebaseObject(firebase.database().ref('schools/' + $scope.user.school));

  userRooms.$loaded()
  .then(function(userRooms){
    // Add room titles
    angular.forEach(userRooms, function(userRoom, key){
      var titleArr = [];
      angular.forEach(userRoom.chatters, function(chatter, key){
        if(chatter.id !== $scope.user.user_id){
          titleArr.push(' ' + chatter.name.split(' ')[0]);
        } 
      });
      userRoom.title = titleArr.join();
    });
    // If they don't have a title the current user is the only one there
    $scope.rooms = userRooms;
  });
  
  $scope.$on('chatSubmitChanged', function(e, newValues){
    var submitSlideout = angular.element(document.getElementsByClassName('submit-slideout'));
    if(!newValues[0] && newValues[1].length > 0){
      submitSlideout.css({right: '0px', transition: 'all 600ms cubic-bezier(0.95, 0.05, 0.795, 0.035)'});
    } else {
      submitSlideout.css({right: '-100px', transition: 'all 600ms cubic-bezier(0.95, 0.05, 0.795, 0.035)'});
    }
  });

  $ionicModal.fromTemplateUrl('templates/new-chat.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal= modal;
  });

  $scope.$on('$destroy', function(){
    $scope.modal.remove();
  });

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.openModal = function(){
    $scope.modal.show();
  }

  function getChatters(id){
    var deferred = $q.defer(),
        chatterIds = [],
        roomIndex = $scope.rooms.map(function(room){ 
          return room.$id 
        }).indexOf(id),
        chatters = $scope.rooms[roomIndex].chatters;
    // Get ids of everyone the user is chatting
    if(typeof chatters === "object"){
      angular.forEach(chatters, function(value, key){
        if(value.id !== $scope.user.user_id){
          chatterIds.push(value.id);
        }
      });
    } else {
      for (var i = chatters.length - 1; i >= 0; i--) {
        chatters[i]
        if(chatters[i].id !== $scope.user.user_id){
          chatterIds.push(chatters[i].id);
        }
      }
    }
    
    if(chatters && chatterIds.length > 0){
      deferred.resolve(chatterIds);
    } else {
      deferred.reject('No other chatters');
    }

    return deferred.promise;
  }

  $scope.openChatRoom = function (id) {
    getChatters(id)
    .then(function(chatters){
      $state.go('app.room', { 
        roomId: id,
        chatters: chatters
      });
      $scope.closeModal();
    });
  }

  $scope.createRoom = function() {
    var newRoomId = firebase.database().ref('user-rooms').child($scope.user.user_id).push().key,
        id = Rooms.addNewRoom(this.$$childHead.selectedValues, '/user-rooms/', newRoomId);
    $state.go('app.room', {roomId: id});
    $scope.closeModal();
  }

}]);