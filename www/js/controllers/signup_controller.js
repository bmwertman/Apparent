Pta.controller('SignupCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  function($scope, $ionicSideMenuDelegate, $ionicModal) {

  $ionicSideMenuDelegate.canDragContent(true);

  $scope.parent = {};
  $scope.parent.children = [];
  $scope.numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  $scope.grades = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

}]);


