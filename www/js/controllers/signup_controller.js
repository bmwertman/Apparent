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
  '$ionicModal',
  function ($scope, $ionicSideMenuDelegate, Auth, $ionicLoading, $firebaseArray, $state, userService, $localstorage, $cordovaDevice, $firebaseObject, $timeout, Answers, $animate, $ionicModal) {
    $ionicSideMenuDelegate.canDragContent(true)
    $scope.newUser = {}
    $scope.inputType = 'password'

    var signupBtn = angular.element(document.getElementById('signupBtn'))

    if (navigator.splashscreen) {
      $timeout(function () {
        navigator.splashscreen.hide()
      })
    }

    $scope.btnVal = 'Signup'

    $scope.getForm = function (signupForm) {
      $scope.signupForm = signupForm
    }

    $scope.signupSubmit = function (signupForm) {
      $scope.errorMessage = null
      if ($scope.newUser.password === $scope.newUser.confirm_password) {
        if (signupForm.$invalid) {
          var errField = angular.element(document.getElementById(signupForm.$error[Object.keys(signupForm.$error)[0]][0].$name))
          var errorModel = 'newUser.' + errField.attr('id')
          var unbindWatcher = $scope.$watch(errorModel, function (newVal, oldVal) {
            if (signupForm.$valid) {
              $scope.btnVal = 'Signup'
              signupBtn.removeClass('signupErr')
              signupBtn.addClass('submit')
              unbindWatcher()
            }
          })
          angular.forEach(signupForm.$error, function (value, key) {
            var el = document.getElementById(key)
            signupBtn.removeClass('submit')
            signupBtn.addClass('signupErr')
            $scope.errorMessage = 'Invalid ' + key
            $scope.btnVal = 'Invalid ' + key
            $animate.addClass(el, 'shake', function () {
              $animate.removeClass(el, 'shake')
            })
          })
        } else {
          if ($scope.newUser.agreed) {
            Auth.createUser($scope.newUser.email, $scope.newUser.password)
              .then(function (authData) {
                var newUser = firebase.auth().currentUser
                newUser.sendEmailVerification()
                  .then(function () {
                    $localstorage.set('emailSent', true)
                    if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                      $localstorage.set('email', $scope.newUser.email)
                      $localstorage.set('password', $scope.newUser.password)
                    }
                    var userProfile = {
                      name: $scope.newUser.name,
                      email: $scope.newUser.email,
                      user_id: authData.uid,
                      agreed_tos: true,
                      isAdmin: false
                    }
                    var ref = firebase.database().ref()
                    var usersRef = ref.child('users').child(authData.uid)
                    usersRef.update(userProfile)
                    userService.setUser(userProfile)
                    Answers.sendSignup('email', true, userProfile)
                    $scope.newUser = {}
                    $state.go('verify')
                  })
                  .catch(function (error) {
                    Answers.sendCustomEvent('Failed to send new user email confirmation.', error)
                    console.log('Failed to send new user email confirmation. Error: ' + error.code + ' ' + error.message)
                  })
              })
          } else {
            var agreedWrapper = document.getElementById('agreed-wrapper')
            var unbindagreedWatcher = $scope.$watch('newUser.agreed', function (newValues) {
              if (newValues) {
                signupBtn.removeClass('signupErr')
                signupBtn.addClass('submit')
                $scope.btnVal = 'Signup'
                unbindagreedWatcher()
              }
            })
            signupBtn.removeClass('submit')
            signupBtn.addClass('signupErr')
            $scope.btnVal = 'Agree with Terms'
            $animate.addClass(agreedWrapper, 'shake', function () {
              $animate.removeClass(agreedWrapper, 'shake')
            })
          }
        }
      } else {
        var password = document.getElementById('password')
        var confirm = document.getElementById('confirm')
        var unbindGroupWatcher = $scope.$watchGroup(['newUser.password', 'newUser.confirm_password'], function (newValues) {
          if (newValues[0] === newValues[1]) {
            signupBtn.removeClass('signupErr')
            signupBtn.addClass('submit')
            $scope.btnVal = 'Signup'
            unbindGroupWatcher()
          }
        })
        signupBtn.removeClass('submit')
        signupBtn.addClass('signupErr')
        $scope.btnVal = 'Unmatched passwords'
        $animate.addClass(password, 'shake', function () {
          $animate.removeClass(password, 'shake')
        })
        $animate.addClass(confirm, 'shake', function () {
          $animate.removeClass(confirm, 'shake')
        })
      }
    }

    $scope.hideShowPassword = function () {
      if ($scope.inputType === 'password') {
        $scope.inputType = 'text'
        $scope.isShown = true
      } else {
        $scope.inputType = 'password'
        $scope.isShown = false
      }
    }

    $ionicModal.fromTemplateUrl('templates/tos.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal
    })

    $scope.openTos = function () {
      $scope.modal.show()
    }

    $scope.closeTos = function () {
      $scope.modal.hide()
    }

    $scope.$on('$destroy', function () {
      $scope.modal.$remove()
    })
  }])
