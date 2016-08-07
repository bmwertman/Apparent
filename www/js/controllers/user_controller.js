Pta.controller('UserCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  'userService',
  '$cordovaImagePicker',
  '$filter',
  '$timeout',
  '$stateParams',
  '$http',
  '$firebaseArray',
  '$firebaseObject',
  function($scope, $ionicSideMenuDelegate, $ionicModal, userService, $cordovaImagePicker, $filter, $timeout, $stateParams, $http, $firebaseArray, $firebaseObject) {
    // Future work - Add child's current teacher to their parent's profile
    var schoolName = angular.element(document.getElementById('school-name')),
        userName = angular.element(document.getElementById('name-wrap'));
        schoolInputParent = schoolName.children().eq(0),
        ref = firebase.database().ref(),
        schoolsRef = ref.child('schools');

    $scope.isNewUser = $stateParams.isNewUser;
    $scope.user = userService.getUser();
    $scope.grades = { 'K': 0, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10, '11th': 11, '12th': 12 };

    // Set the width of edit-in-place input fields to fit their content for view centering 
    $scope.getTextWidth = function(font, text, angularEl, isSchoolName) {
      var canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement("canvas")),
      context = canvas.getContext("2d");
      context.font = font;
      if(text.indexOf("/") > -1){
         text = text.substring(0, text.lastIndexOf('/'))
      }
      var metrics = context.measureText(text);
      angularEl.css('width', (metrics.width + 3) + 'px');
      angularEl.children().eq(0).css('width', (metrics.width + 3) + 'px');
    }

    $scope.getTextWidth(userName.attr('font'), $scope.user.name, userName);
    schoolInputParent.append('<i id="school-name-edit" class="icon ion-edit"><span>EDIT</span></i>');
    
    //handle submits
    $scope.editSubmit = function(modelValue, prop){
      var userId = $scope.user.user_id,
          userRef = ref.child('users').child(userId),
          schools = $firebaseArray(schoolsRef),
          obj = {};
      if(!prop && modelValue){// We're adding a school
        var school = schools.$getRecord(modelValue['NCESSCH']);
        if(school){// If the school is already there
          obj['school'] = modelValue['NCESSCH'];
        } else {
          angular.forEach(modelValue, function(value, key){
            switch(key){
              case "SCHNAM09":
                obj['name'] = value;
                break;
              case "PHONE09":
                obj['phone'] = value;
                break;
              case "MSTREE09":
                obj['street_address'] = value;
                break;
              case "MCITY09":
                obj['city'] = value;
                break;
              case "MSTATE09":
                obj['state'] = value;
                break;
              case "MZIP09":
                obj['zip'] = value;
                break;
              case "LATCOD09":
                obj['lat'] = value;
                break;
              case "LONCOD09":
                obj['lon'] = value;
                break;
            }
          });
        }
        schoolsRef.child(modelValue['NCESSCH']).set(obj);
        userRef.update({school: modelValue['NCESSCH']});
        $firebaseObject(schoolsRef.child(modelValue['NCESSCH']))
        .$loaded().then(function(school){// Load the user's new school
          $scope.school = school;
          $scope.getTextWidth(schoolName.attr('font'), school.name, schoolName);
        }); 
      } else if(modelValue) {
        obj[prop] = modelValue;
        userRef.update(obj);
      }
    }

    $scope.editChildren = function(){
      debugger;
    }

    if($scope.user.school){ // Load the user's school
      $firebaseObject(schoolsRef.child($scope.user.school))
      .$loaded().then(function(school){
        $scope.school = school;
        var name = schoolInputParent.children().eq(0);
        name.val(school.name);
        $scope.getTextWidth(schoolName.attr('font'), school.name, schoolName);
      });
    }
    // Make sure both users and their children have either a pic or first letter of first name placeholder
    if(!$scope.user.pic){
      $scope.editSubmit($scope.user.name.charAt(0), 'pic');
    }
    if($scope.user.children){
      angular.forEach($scope.user.children, function(child, key){
        if(!child.pic){
          child.pic = child.name.charAt(0);
          $scope.editSubmit(child, 'children/' + key);
        }
      });
    }
  
    $ionicModal.fromTemplateUrl('templates/crop-image.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $ionicModal.fromTemplateUrl('templates/add-child.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.childModal = modal;
    });

    $scope.cropImageModal = function() {
        $scope.modal.show();
    };

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
      $scope.childModal.remove();
    });

    $scope.openModal = function(name){
      if(name === "child-modal"){
        $scope.childModal.show();
      } else {
        $scope.modal.show;
      }
    }

    $scope.closeModal = function(name) {
      if(name === "child-modal"){
        $scope.childModal.hide();
      } else{
        $scope.modal.hide();
      }
    };
  
    //image pic & crop
    $scope.getImage = function(childPath){
      if(childPath){//We're saving an image of a user's child
        $scope.childPath = childPath;
      }
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

    $scope.querySchools = function(searchText){
      return $http.get("https://inventory.data.gov/api/action/datastore_search",{
        params:({
          resource_id: "102fd9bd-4737-401b-b88f-5c5b0fab94ec",
          limit: 10,
          q: searchText
        })
      })
      .then(function(response){
        return response.data.result.records;
      })
      .catch(function(error){
        console.log(error);
        return error
      });
    }

    $scope.storeImage = function(file){
      var imageDataArray = file.split(','),
          binary = window.atob(imageDataArray[1]),
          array = new Uint8Array(binary.length),
          storageRef = firebase.storage().ref(),
          urlSavePath,
          storagePath;
      for( var i = 0; i < binary.length; i++ ) { 
        array[i] = binary.charCodeAt(i) 
      }
      var image = new Blob([array]);
      if($scope.childPath){
        var childIndex = $scope.childPath.split('/')[1];
        urlSavePath = $scope.childPath;
        storagePath = 'profile_pics/children/' + $scope.user.user_id + childIndex +'.jpg';
      } else {
        urlSavePath = 'pic';
        storagePath = 'profile_pics/' + $scope.user.user_id +  +'.jpg';
      }
      var uploadTask = storageRef.child(storagePath);
      uploadTask.getDownloadURL()
      .then(function(onResolved){// Ensure we're only storing one profile pic per user
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
                $scope.editSubmit(uploadTask.snapshot.downloadURL, urlSavePath);
                $scope.closeModal();
                if($scope.childPath){// Cleanup the path of the saved child
                  delete $scope.childPath;
                }
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
            $scope.editSubmit(uploadTask.snapshot.downloadURL, urlSavePath);
            $scope.closeModal();
            if($scope.childPath){// Cleanup the path of the saved child
              delete $scope.childPath;
            }

          }
        });
      });
    }

    $ionicSideMenuDelegate.canDragContent(true);
}]);


