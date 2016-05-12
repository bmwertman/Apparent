Pta.controller('SignupCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  function($scope, $ionicSideMenuDelegate, $ionicModal) {

  $ionicSideMenuDelegate.canDragContent(true);
  $scope.childCntRcvd = false;
  $scope.user = {};
  $scope.user.children = [];
  $scope.grades = {
    'K': 0,
    '1st': 1,
    '2nd': 2,
    '3rd': 3,
    '4th': 4,
    '5th': 5,
    '6th': 6,
    '7th': 7,
    '8th': 8,
    '9th': 9,
    '10th': 10,
    '11th': 11,
    '12th': 12
  };

  $scope.childInfoInputs = function(num){
    $scope.childArr = [];
    for (var i = 0; i < num; i++) {
      $scope.childArr.push(i);
    }
    $scope.childCntRcvd = true;
  }

  $ionicModal.fromTemplateUrl('templates/signup.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.modal = modal;
  });

  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };

}]);


