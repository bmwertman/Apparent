Pta.controller('EventsCtrl', [
  '$scope', 
  '$ionicSideMenuDelegate', 
  '$firebaseArray',
  '$state',
  '$ionicPopup',
  'userService',
  function($scope, $ionicSideMenuDelegate, $firebaseArray, $state, $ionicPopup, userService) {

  $ionicSideMenuDelegate.canDragContent(true);

  // Get the event data from firebase as an array
  var ref = firebase.database().ref();
  var eventsRef = ref.child('events').orderByChild('date');
  $scope.calEvents = $firebaseArray(eventsRef);
  $scope.user = userService.getUser();

  if(!$scope.user.school || $scope.user.school === ""){
    var noSchoolAlert = $ionicPopup.alert({
      title: 'You haven\'t set your school',
      subTitle:"Apparent connects you with events at your child's school.",
      template: "Add your child's school on your profile to see what is happening!",
      okText: "Set School",
      okType: "button-balanced"
    });
    noSchoolAlert.then(function(res){
      $state.go('app.profile');
    });
  }
  
  $scope.showEvent = function(event){
    $state.go('app.calendar',{selectedEvent: event});
  };
  
  $scope.volunteersNeeded = [];

  $scope.roles = ["Setup", "Event", "Cleanup"];

  for (var i = $scope.roles.length - 1; i >= 0; i--) {
    var role = {};
    role.name = $scope.roles[i];
    $scope.volunteersNeeded.push(role);
  }
  
  $scope.volunteersNeeded.unshift({name: 'All'});
  
}]);


