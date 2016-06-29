Pta.controller('EventsCtrl', [
  '$scope', 
  '$ionicSideMenuDelegate', 
  'FIREBASE_URL',
  '$firebaseArray',
  '$state',
  function($scope, $ionicSideMenuDelegate, FIREBASE_URL, $firebaseArray, $state) {

  $ionicSideMenuDelegate.canDragContent(true);

  // Get the event data from firebase as an array
  var ref = new Firebase(FIREBASE_URL);
  var eventsRef = ref.child('events').orderByChild('date');
  $scope.calEvents = $firebaseArray(eventsRef);
  
  $scope.showEvent = function(event){
    $state.go('app.calendar',{selectedEvent: event});
  }
  
  $scope.volunteersNeeded = [];

  $scope.roles = ["Setup", "Event", "Cleanup"];

  for (var i = $scope.roles.length - 1; i >= 0; i--) {
    var role = {};
    role.name = $scope.roles[i];
    $scope.volunteersNeeded.push(role);
  };
  $scope.volunteersNeeded.unshift({name: 'All'});
  
}]);


