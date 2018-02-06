Pta.controller('LoginCtrl', [
  '$scope',
  '$ionicModal',
  '$ionicPopup',
  '$timeout',
  '$ionicLoading',
  'Auth',
  function($scope, $ionicModal, $ionicPopup, $timeout, $ionicLoading, Auth) {

    // var emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
    
    // Form data for the login view
    $scope.credentials = {};

    $scope.errorMessage = null;

    // hide error messages until 'submit' event
    $scope.submitted = false;
    // hide success message
    $scope.showMessage = false;
    // method called from shakeThat directive
    $scope.submit = function() {
      $ionicLoading.show({ template: '<ion-spinner></ion-spinner>'});
      Auth.login($scope.credentials);
      $scope.credentials = {};
      $ionicLoading.hide();
    };

    $scope.resetError = function(){ $scope.emailBlank = false; }
    $scope.invalidEmail = false;
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