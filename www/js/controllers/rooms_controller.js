Pta.controller('RoomsCtrl', [
  '$scope',
  'Rooms',
  'Chats',
  '$state',
  '$ionicModal',
  'userService',
  function ($scope, Rooms, Chats, $state, $ionicModal, userService) {

  $scope.user = userService.getUser();
  $scope.rooms = Rooms.all();
  $scope.searchSchool = false;

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

  $scope.openChatRoom = function (roomId) {
    $state.go('app.chat', {
      roomId: roomId
    });
  }
}]);