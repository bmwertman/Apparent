Pta.controller('LoginCtrl', [
  '$scope',
  '$ionicModal',
  '$ionicPopup',
  '$timeout',
  '$ionicLoading',
  'Auth',
  '$animate',
  'Answers',
  function($scope, $ionicModal, $ionicPopup, $timeout, $ionicLoading, Auth, $animate, Answers) {

    $scope.credentials = {};
    $scope.errorMessage = null;
    $scope.inputType = 'password';
    $scope.submitted = false;
    $scope.showMessage = false;
    $scope.invalidEmail = false;
    $scope.isShown = false;

    document.getElementById('loginSubmitBtn').onclick = function() {
      $ionicLoading.show({ template: '<ion-spinner></ion-spinner>', hideOnStateChange: true});
      $scope.userEmail = $scope.credentials.email
      Auth.login($scope.credentials)
      .then(function(res){
        if(res && res.code === "auth/wrong-password"){
          $scope.errorMessage = "Invalid password";
          $scope.showMessage = true;
          var el = document.getElementById('password');
          $ionicLoading.hide().then(function(){
            $scope.credentials = {email: $scope.userEmail};
          });
          $animate.addClass(el, 'shake', function() {
            $animate.removeClass(el, 'shake');
          });
        } else if (res && res.code === "Sign in success"){
          $scope.credentials = {};
          $scope.showMessage = false;
          $scope.errorMessage = null;
        } else {
          Answers.sendCustomEvent("UncaughtLoginRes", res);
          console.log('UncaughtLoginRes res.code: ' + res.code);
        }
      });
    };
  
    $scope.hideShowPassword = function(){
      if ($scope.inputType == 'password'){
        $scope.inputType = 'text';
        $scope.isShown = true;
      } else {
        $scope.inputType = 'password';
        $scope.isShown = false;
      }
    };

    $scope.resetError = function(){ $scope.emailBlank = false; }
    
    $scope.confirmReset = function(){
      $scope.data= {};
      var confirmResetPopup = $ionicPopup.show({
        template: "<input type='email' placeholder='Enter email' ng-keyup='resetError()' ng-model='data.resetEmail'><br><p ng-show='invalidEmail' class='email-valid'>Please enter a valid email</p>",
        title: "Reset password",
        cssClass: "reset-popup",
        subTitle: "Would you like a reset email sent?",
        scope: $scope,
        buttons:[
          { text: "Cancel",
            type: "button-stable"
          },
          { text: "<b>Send</b>",
            type: "send",
            onTap: function(e){
              if(!emailRegex.test($scope.data.resetEmail)){
                e.preventDefault();
                $scope.invalidEmail = true;
              } else {
                Auth.passwordReset($scope.data.resetEmail);
              } 
            }
          }
        ]
      });
    }
}]);