Pta.controller('UserCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  'userService',
  '$cordovaImagePicker',
  '$filter',
  '$timeout',
  function($scope, $ionicSideMenuDelegate, $ionicModal, userService, $cordovaImagePicker, $filter, $timeout) {

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

    $scope.storeImage = function(file){
      var imageDataArray = file.split(','),
          binary = window.atob(imageDataArray[1]),
          array = new Uint8Array(binary.length);
      for( var i = 0; i < binary.length; i++ ) { 
        array[i] = binary.charCodeAt(i) 
      }
      var image = new Blob([array]);
      var storageRef = firebase.storage().ref(),
          uploadTask = storageRef.child('profile_pics/' + $scope.user.user_id + '.jpg')
      uploadTask.getDownloadURL()
      .then(function(onResolved){// Ensure we're only storing one profile pic per user
        uploadTask.delete()
        .then(function(){
          var uploadTask = storageRef.child('profile_pics/' + $scope.user.user_id + '.jpg').put(image);
          uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, {
            next: function(snapshot){
              var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                  console.log('Upload is paused');
                  break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                  console.log('Uploading ' + progress + "% complete");
                  break;
              }
            }, 
            error: function(error){
              switch (error.code) {
                 case 'storage/unauthorized':
                   console.log("You don't have permission to access this image");
                   break;

                 case 'storage/canceled':
                   console.log("Upload was canceled");
                   break;
              }
            },
            complete: function(){
                $scope.editSubmit(uploadTask.snapshot.downloadURL, 'pic');
                $scope.closeModal();
            }
          });
        }).catch(function(error){
          console.log(error);
        });
      }).catch(function(onReject){
        var uploadTask = storageRef.child('profile_pics/' + $scope.user.user_id + '.jpg').put(image);
        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, {
          next: function(snapshot){
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
              case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Uploading ' + progress + "% complete");
                break;
            }
          }, 
          error: function(error){
            switch (error.code) {
               case 'storage/unauthorized':
                 console.log("You don't have permission to access this image");
                 break;

               case 'storage/canceled':
                 console.log("Upload was canceled");
                 break;
            }
          },
          complete: function(){
            $scope.editSubmit(uploadTask.snapshot.downloadURL, 'pic');
            $scope.closeModal();
          }
        });
      });
    }

    //handle submits
    $scope.editSubmit = function(modelValue, prop){
      var userId = $scope.user.user_id,
          ref = firebase.database().ref(),
          userRef = ref.child('users').child(userId),
          obj = {};
      obj[prop] = modelValue;
      userRef.update(obj);
    }

}]);


