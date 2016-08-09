Pta.controller('RoomsCtrl', [
  '$scope',
  'Rooms',
  '$state',
  '$ionicModal',
  'userService',
  '$firebaseObject',
  '$ionicPopup',
  function ($scope, Rooms, $state, $ionicModal, userService, $firebaseObject, $ionicPopup) {
  var userRooms = Rooms.all();
  userRooms.$loaded()
  .then(function(userRooms){
    $scope.rooms = userRooms;
  });
  
  $scope.user = userService.getUser();
  $scope.school = $firebaseObject(firebase.database().ref('schools/' + $scope.user.school));

  // If The user has not selected their school redirect to the profile view
  // because we can't filter the people who they are alllowed to chat with
  if(!$scope.user.school || $scope.user.school === ""){
    var noSchoolAlert = $ionicPopup.alert({
      title: 'You haven\'t set your school',
      subTitle:"Apparent chat connects you with parents at your child's school.",
      template: "Add your child's school on your profile to start chatting!",
      okText: "Set School",
      okType: "button-balanced"
    });
    noSchoolAlert.then(function(res){
      $state.go('app.profile');
    });
  }

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