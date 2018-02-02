Pta.controller('EmailVerifyCtrl', [
  '$scope',
  'Auth',
  '$timeout',
  '$firebaseAuth',
  '$localstorage',
  '$rootScope',
  '$ionicHistory',
  function($scope, Auth, $timeout, $firebaseAuth, $localstorage, $rootScope, $ionicHistory){
    $scope.resend = function(){
      var spinner = document.getElementById('sending');
      spinner.style.display = "block";
      $timeout(function(){
        spinner.style.display = "none";
      }, 1500);
      firebase.auth().currentUser.sendEmailVerification();
    }
    
    document.addEventListener("resume", function(){
      var credentials = {
            email: $localstorage.get('email'),
            password: $localstorage.get('password')
          }
      // Only set the firebase user to local storage  when arriving at this view from the signup page, ie a new user
      if($ionicHistory.backView.stateName && $ionicHistory.backView.stateName === 'signup' ){
        $rootScope.fbUser = $localstorage.get('firebase:authUser:AIzaSyCqFHdSGIab4VtdYra_H-EiDo4ovMTwlTk:[DEFAULT]');
      }

      // Only reload the page when a email verification email has been sent
      location.reload($localstorage.get("emailSent"));
      if (firebase.auth().currentUser.emailVerified) {
        // Cleanup
        document.removeEventListener("resume");
        $localstorage.set('firebase:authUser:AIzaSyCqFHdSGIab4VtdYra_H-EiDo4ovMTwlTk:[DEFAULT]', JSON.parse($rootScope.fbUser));

        // Log them in
        Auth.login(credentials);
      }
    });
}])