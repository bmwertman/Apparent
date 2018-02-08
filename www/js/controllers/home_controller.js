Pta.controller('HomeCtrl', [
  '$scope',
  'userService',
  '$firebaseObject',
  '$timeout',
  '$state',
  '$ionicNavBarDelegate',
  'Auth',
  '$localstorage',
  function($scope, userService, $firebaseObject, $timeout, $state, $ionicNavBarDelegate, Auth, $localstorage) {
    
    $ionicNavBarDelegate.align('center');

    window.screen.lockOrientation('portrait');

    $scope.logout = function(){
      Auth.logout();
    }
    if(userService.getUser()){
      $scope.user = userService.getUser();
    } else {
      $firebaseObject(firebase.database().ref('users').child(JSON.parse($localstorage.get('firebase:authUser:AIzaSyCqFHdSGIab4VtdYra_H-EiDo4ovMTwlTk:[DEFAULT]')).uid)).$loaded()
      .then(function(user){
        $scope.user = user;
      });
    }
    if($scope.user.school){
      var school = $firebaseObject(firebase.database().ref('schools').child($scope.user.school));
      school.$loaded(function(school){
        $scope.school = school;
      });
    } else {
      var nameArr = $scope.user.name.split(' ');
      $scope.school = {};
      $scope.school.name = "Welcome " + nameArr[0];
    }
}]);


