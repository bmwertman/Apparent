Pta.controller('RoomsCtrl', [
  '$scope',
  'Rooms',
  '$state',
  '$ionicModal',
  'userService',
  '$firebaseObject',
  function ($scope, Rooms, $state, $ionicModal, userService, $firebaseObject) {
  var userRooms = Rooms.all();
  userRooms.$loaded()
  .then(function(userRooms){
    $scope.rooms = userRooms;
  });
  // Future work - if $scope.school is null block view and redirect user to add their school to their profile
  $scope.user = userService.getUser();
  $scope.school = $firebaseObject(firebase.database().ref('schools/' + $scope.user.school));

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

  $scope.openChatRoom = function (id) {
    $state.go('app.rooms.chat', { roomId: id});
    $scope.closeModal();
  }

  $scope.createRoom = function() {
    var id = Rooms.addNewRoom(this.$$childHead.selectedValues, '/user-rooms/');
    $state.go('app.rooms.chat', {roomId: id});
    $scope.closeModal();
  }

}]);