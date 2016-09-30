Pta.controller('SettingsCtrl', [
  '$scope',
  'userService',
  '$firebaseObject',
  '$cordovaImagePicker',
  '$ionicModal',
  function($scope, userService, $firebaseObject, $cordovaImagePicker, $ionicModal) {
    $scope.user = userService.getUser();
    var school = $firebaseObject(firebase.database().ref('schools').child($scope.user.school));
    if(school){
      school.$loaded(function(school){
        $scope.school = school;
      });
    }

    //image pick & crop
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

    $ionicModal.fromTemplateUrl('templates/crop-logo.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.cropImageModal = function() {
        $scope.modal.show();
    };

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });

    $scope.openModal = function(name){
      $scope.modal.show;
    }

    $scope.closeModal = function(name) {
      $scope.modal.hide();
    };

    $scope.storeImage = function(file){
      var imageDataArray = file.split(','),
          binary = window.atob(imageDataArray[1]),
          array = new Uint8Array(binary.length),
          storageRef = firebase.storage().ref(),
          urlSavePath = 'school/' + $scope.user.school + '/logo',
          storagePath = 'logo_pics/' + $scope.user.school + '.jpg',
          uploadTask = storageRef.child(storagePath);
      for( var i = 0; i < binary.length; i++ ) { 
        array[i] = binary.charCodeAt(i) 
      }
      var image = new Blob([array]);
      uploadTask.getDownloadURL()
      .then(function(onResolved){// Ensure we're only storing one logo per school
        uploadTask.delete()
        .then(function(){
          var uploadTask = storageRef.child(storagePath).put(image);
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
              school.logo = uploadTask.snapshot.downloadURL;
              school.$save().then(function(){
                $scope.closeModal();
              });
            }
          });
        }).catch(function(error){
          console.log(error);
        });
      }).catch(function(onReject){
        var uploadTask = storageRef.child(storagePath).put(image);
        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, {
          next: function(snapshot){
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            switch (snapshot.state) {
              case firebase.storage.TaskState.PAUSED: // or 'paused'
                break;
              case firebase.storage.TaskState.RUNNING: // or 'running'
                break;
            }
          }, 
          error: function(error){
            switch (error.code) {
               case 'storage/unauthorized':
                 break;
               case 'storage/canceled':
                 console.log("Upload was canceled");
                 break;
            }
          },
          complete: function(){
            school.logo = uploadTask.snapshot.downloadURL;
            school.$save().then(function(){
              $scope.closeModal();
            });
          }
        });
      });
    }
}]);


