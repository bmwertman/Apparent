Pta.controller('UserCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  'userService',
  '$cordovaImagePicker',
  '$filter',
  function($scope, $ionicSideMenuDelegate, $ionicModal, userService, $cordovaImagePicker, $filter) {

    $ionicSideMenuDelegate.canDragContent(true);
    // var parts = $scope.full_name.split(" "),
    //     first = parts.shift(),
    //     last = parts.shift() || "";

    $scope.user = userService.getUser();

    $ionicModal.fromTemplateUrl('templates/crop-image.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.cropImageModal = function() {
        $scope.modal.show();
    };

    $scope.$on('$destroy', function(){
        $scope.modal.remove();
    });

    $scope.closeModal = function() {
        $scope.modal.hide();
        $scope.event = {};
    };
  
    //image pic & crop
    $scope.getImage = function(){
      $cordovaImagePicker.getPictures({
      maximumImagesCount: 1
      })
      .then(function (results) {
        $scope.picFile = results[0];
        $scope.cropImageModal();
      }, function(error) {
       console.log(error)
      });
    }

    //phone type
    $scope.phoneTypes = [
      {value: 1, text: 'Cell'},
      {value: 2, text: 'Home Phone'}
    ];

    if($scope.user.phone_type !== 1 && $scope.user.phone_type !== 2){
      $scope.phoneTypes.push({value: 0, text: 'Home or Cell Phone?'});
      $scope.user.phone_type = 0;
      $scope.type = angular.element(document.getElementById('phone-type'));
      $scope.type.attr("style", "margin-bottom:20px;color:red;" );
    }
    $scope.phoneTypeStyle = function(){
      if($scope.type) {
        $scope.type.removeAttr('style');
      }
    }
  
    $scope.phoneType = function() {
      var selected = $filter('filter')($scope.phoneTypes, {value: $scope.user.phone_type});
      return ($scope.user.phone_type && selected.length) ? selected[0].text : 'Home or Cell Phone?';
    };

    //handle submits
    $scope.editSubmit = function(modelValue, prop, cb){
      var userId = $scope.user.user_id;
      var ref = firebase.database().ref();
      var userRef = ref.child('users').child(userId);
      var obj = {};
      obj[prop] = modelValue;
      userRef.update(obj);
      if(cb){
        cb();
      }
    }

}]);


