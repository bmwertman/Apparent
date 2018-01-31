Pta.controller('EmailVerifyCtrl', [
  '$scope',
  'Auth',
  '$timeout',
  function($scope, Auth, $timeout){
    $scope.resend = function(){
      var spinner = document.getElementById('sending');
      spinner.style.display = "block";
      $timeout(function(){
        spinner.style.display = "none";
      }, 1500);
      firebase.auth().currentUser.sendEmailVerification();
    }
    document.addEventListener("pause", function(){
      ionic.Platform.exitApp();
    }, false);
    document.addEventListener("resume", function(){
      location.reload(true);
      if(firebase.auth().currentUser.emailVerified){
        Auth.login();
      }
    }, false);
}])