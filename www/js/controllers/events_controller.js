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

  $scope.calEvents.$loaded(function(data){
    // This is where you have access to the data after it has loaded!!!
  });
  
  $scope.showEvent = function(event){
    $state.go('app.calendar',{selectedEvent: event});
  }
  // $ionicModal.fromTemplateUrl('templates/volunteer_signup.html', {
  //   scope: $scope,
  //   animation: 'slide-in-up'
  // }).then(function(modal) {
  //   $scope.modal = modal;
  // });

  // $scope.openModal = function(event) {
  //   $scope.displayEvent = event;
  //   $scope.modal.show();
  // };
  // $scope.closeModal = function() {
  //   $scope.modal.hide();
  // };
  
  // $scope.$on('$destroy', function() {
  //   $scope.modal.remove();
  // });

  $scope.volunteersNeeded = [];

  $scope.roles = ["Setup", "Event", "Cleanup"];

  for (var i = $scope.roles.length - 1; i >= 0; i--) {
    var role = {};
    role.name = $scope.roles[i];
    $scope.volunteersNeeded.push(role);
  };
  $scope.volunteersNeeded.unshift({name: 'All'});
  
}]);


