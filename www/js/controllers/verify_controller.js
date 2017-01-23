Pta.controller('EmailVerifyCtrl', [
  '$scope',
  function($scope){
    $scope.resend = function(){
      var spinner = document.getElementById('sending');
      spinner.style.display = "block";
      $timeout(function(){
        spinner.style.display = "none";
      }, 1500);
      firebase.auth().currentUser.sendEmailVerification();
    }
  
}])