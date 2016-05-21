Pta.controller('UserCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  'FIREBASE_URL',
  'userService',
  '$cordovaImagePicker',
  '$jrCrop',
  '$filter',
  function($scope, $ionicSideMenuDelegate, $ionicModal, FIREBASE_URL, userService, $cordovaImagePicker, $jrCrop, $filter) {

    $ionicSideMenuDelegate.canDragContent(true);
    // var parts = $scope.full_name.split(" "),
    //     first = parts.shift(),
    //     last = parts.shift() || "";

    $scope.user = userService.getUser();
    
    //image pic & crop
    $scope.getImage = function(){
      $cordovaImagePicker.getPictures({
      maximumImagesCount: 1
      })
      .then(function (results) {

        $jrCrop.crop({
          url: results[0],
          width: 100,
          height: 145,
          circle: true
        }).then(function(canvas){
          $scope.user.pic = canvas.toDataURL()
          $scope.editSubmit($scope.user.pic, 'pic');
        });

      }, function(error) {
       // error getting photos
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
    $scope.editSubmit = function(modelValue, prop){
      var ref = new Firebase(FIREBASE_URL);
      var userId = $scope.user.user_id;
      var userRef = ref.child('users').child(userId);
      var obj = {};
      obj[prop] = modelValue;
      userRef.update(obj);
    }

}]);


