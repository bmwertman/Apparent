Pta.controller('LoginCtrl', [
  '$scope',
  '$ionicModal',
  '$ionicPopup',
  '$timeout',
  '$ionicLoading',
  '$localstorage',
  'Auth',
  '$state',
  function($scope, $ionicModal, $ionicPopup, $timeout, $ionicLoading, $localstorage, Auth, $state) {

  $scope.openSignup = function(){
    $state.go('signup');
  }

  // Form data for the login view
  $scope.credentials = {};
  $scope.submitted = false;
  

  // Log in using firebase's login API
  $scope.doLogin = function () {
    $scope.errorMessage = null;
    $ionicLoading.show({ template: '<ion-spinner></ion-spinner>'});
    Auth.login($scope.credentials.email, $scope.credentials.password)
    .then(function(authData){
      if(ionic.Platform.isAndroid() || ionic.Platform.isIOS()){
        $localstorage.set('email', $scope.credentials.email);
        $localstorage.set('password', $scope.credentials.password);
      } else {
        $scope.credentials = {};
      }
      Auth.onAuth($ionicLoading.hide);
    }).catch(function(error){
      $ionicLoading.hide();
      console.log("Login Failed!", error);
      $scope.submitted = true;
      $scope.errorMessage = error.message;
      $scope.$apply();
    });
  };

  var emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
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
  
}])
.directive('shakeThat', ['$animate', function($animate) {
  return {
    require: '^form',
    scope: {
      submit: '&',
      submitted: '='
    },
    link: function(scope, element, attrs, form) {
      // listen on submit event
      element.on('submit', function() {
        // tell angular to update scope
        scope.$apply(function() {
          // everything ok -> call submit fn from controller
          if (form.$valid) return scope.submit();
          // show error messages on submit
          scope.submitted = true;
          // shake that form
          $animate.addClass(element, 'shake', function() {
            $animate.removeClass(element, 'shake');
          });
        });
      });
    }
  };

}]);