Pta.controller('ContactCtrl', [
  '$scope',
  'userService',
  '$cordovaAppVersion',
  '$cordovaDevice',
  '$http',
  '$ionicPopover',
  '$ionicPopup',
  '$state',
  '$timeout',
  function($scope, userService, $cordovaAppVersion, $cordovaDevice, $http, $ionicPopover, $ionicPopup, $state, $timeout){
    var user = userService.getUser(),
        device = $cordovaDevice.getDevice();

    $cordovaAppVersion.getVersionNumber()
    .then(function(version){
      $scope.appVersion = version;
    });

    $ionicPopover.fromTemplateUrl('templates/feedback-confirmation.html', {
      scope: $scope
    }).then(function(popover){
      $scope.confirmationPopover = popover;
    });

    $scope.clickCount = 0;
    $scope.showFeedbackPopup = function(e){
      var feedbackPopup = $ionicPopup.show({
        templateUrl: 'templates/feedback.html',
        scope: $scope,
        cssClass: 'feedback-popup',
        title: 'Enter Your Feedback',
        buttons: [
          { text: 'Cancel'},
          {
            text: '<b>Submit</b>',
            type: 'button-balanced',
            onTap: function(){
              if($scope.clickCount === 0){
                $scope.clickCount++;
                $scope.sendFeedback(e);
              }
            }
          }
        ]
      });
    }

    $scope.openPopover = function(e) {
      $scope.confirmationPopover.show(e);
    };
    $scope.closePopover = function(popover) {
      $scope.confirmationPopover.hide();
    };
   
    $scope.$on('$destroy', function() {
      $scope.confirmationPopover.remove();
    });

    $scope.feedback = {};
    $scope.sendFeedback = function(e) {
      $http({
        method: 'POST',
        url: 'https://rink.hockeyapp.net/api/2/apps/1c527375374f43568ff947e431f6e68a/feedback',
        params: {
          subject: $scope.feedback.subject,
          text: $scope.feedback.body + '\r\n' +
                                     + '\r\n' +
                                     '\r\nOS: ' + device.platform +
                                     '\r\nApparent version: ' + $scope.appVersion +  
                                     '\r\nCordova version: ' + device.cordova ,
          oem: device.manufacturer,
          model: device.model,
          os_version: device.version,
          cordova_version: device.cordova,
          email: user.email,
          name: user.name,
          created_at: new Date(),
          uuid: device.uuid
        }

      })
      .then(function(){
        $scope.openPopover(e);
        $timeout(function(){
          $state.go('app.home');
          $scope.closePopover();
        }, 3500);
      });
    }
}]);