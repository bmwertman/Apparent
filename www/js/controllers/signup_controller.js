Pta.controller('SignupCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  'Auth',
  '$ionicLoading',
  '$firebaseArray',
  '$state',
  'userService',
  '$localstorage',
  '$cordovaDevice',
  '$firebaseObject',
  '$timeout',
  'Answers',
  '$animate',
  function($scope, $ionicSideMenuDelegate, Auth, $ionicLoading, $firebaseArray, $state, userService, $localstorage, $cordovaDevice, $firebaseObject, $timeout, Answers, $animate) {

  $ionicSideMenuDelegate.canDragContent(true);
  $scope.newUser = {};
  $scope.inputType = 'password';

  var email = $localstorage.get('email');
  var signupBtn = angular.element(document.getElementById('signupBtn'));

  
  if(navigator.splashscreen){
    $timeout(function(){
      navigator.splashscreen.hide(); 
    });
  }

  $scope.btnVal = "Signup"

  $scope.getForm = function(signupForm){
    $scope.signupForm = signupForm;
  }

  function setErrorMessage(){
    angular.forEach(signupForm.$error, function(value, key){
      var el = document.getElementById(key)
      signupBtn.removeClass('submit');
      signupBtn.addClass('signupErr');
      $scope.errorMessage = "Invalid " + key;
      $scope.btnVal = "Invalid " + key;
      $animate.addClass(el, 'shake', function() {
        $animate.removeClass(el, 'shake');
      });
    });
  }

  $scope.signupSubmit = function(signupForm) {
    $scope.errorMessage = null;
    if($scope.newUser.password === $scope.newUser.confirm_password){
      if(signupForm.$invalid){ 
        var errField = angular.element(document.getElementById(signupForm.$error[Object.keys(signupForm.$error)[0]][0].$name));
        var errorModel = 'newUser.' + errField.attr('id');
        var unbindWatcher = $scope.$watch(errorModel, function(newVal, oldVal) {
          if(signupForm.$valid){
            $scope.btnVal = "Signup";
            signupBtn.removeClass('signupErr');
            signupBtn.addClass('submit');
            unbindWatcher();
          }
        });
        setErrorMessage()
      } else {
        Auth.createUser($scope.newUser.email, $scope.newUser.password)
        .then(function(authData) {
          var newUser = firebase.auth().currentUser;
          newUser.sendEmailVerification()
          .then(function(){
            $localstorage.set('emailSent', true);
            if(ionic.Platform.isAndroid() || ionic.Platform.isIOS()){
              $localstorage.set('email', $scope.newUser.email);
              $localstorage.set('password', $scope.newUser.password);
            }
            var userProfile = { name: $scope.newUser.name,
                                email: $scope.newUser.email,
                                user_id: authData.uid,
                                isAdmin: false 
                              },
                ref = firebase.database().ref(),
                usersRef = ref.child('users').child(authData.uid);
            usersRef.update(userProfile);
            userService.setUser(userProfile);
            $scope.newUser = {};
            $state.go('verify');
          })
          .catch(function(error){
            Answers.sendCustomEvent('Failed to send new user email confirmation.', error);
            console.log("Failed to send new user email confirmation. Error: " + error.code + " " + error.message);
          });
        }).catch(function(error) {
          
        });
      } 
    } else {
      var password = document.getElementById('password');
      var confirm = document.getElementById('confirm');
      var unbindGroupWatcher = $scope.$watchGroup(['newUser.password', 'newUser.confirm_password'], function(newValues){
        if(newValues[0] === newValues[1]){
          signupBtn.removeClass('signupErr');
          signupBtn.addClass('submit');
          $scope.btnVal = 'Signup';
          unbindGroupWatcher();
        }
      });
      signupBtn.removeClass('submit');
      signupBtn.addClass('signupErr');
      $scope.btnVal = 'Unmatched passwords';
      $animate.addClass(password, 'shake', function() {
        $animate.removeClass(password, 'shake');
      });
      $animate.addClass(confirm, 'shake', function() {
        $animate.removeClass(confirm, 'shake');
      });
    }
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
}]);


