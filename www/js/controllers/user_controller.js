Pta.controller('UserCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  '$ionicPopup',
  'userService',
  '$cordovaImagePicker',
  '$filter',
  '$timeout',
  '$stateParams',
  '$http',
  '$firebaseArray',
  '$firebaseObject',
  function($scope, $ionicSideMenuDelegate, $ionicModal, $ionicPopup, userService, $cordovaImagePicker, $filter, $timeout, $stateParams, $http, $firebaseArray, $firebaseObject) {
    // Future work - Add child's current teacher to their parent's profile
    $scope.user = userService.getUser();
    $scope.grades = { 'K': 0, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10, '11th': 11, '12th': 12, '?': 13 };

    var schoolName = angular.element(document.getElementById('school-name')),
        userName = angular.element(document.getElementById('name-wrap'));
        schoolInputParent = schoolName.children().eq(0),
        ref = firebase.database().ref(),
        schoolsRef = ref.child('schools'),
        childrenRef = ref.child('users/' + $scope.user.$id + '/children');// jshint ignore:line
    var childWarp = {
          path:{ 
              radius: 24,
              angle: "185deg",
              textPosition: "inside" 
          },
          css: "letter-spacing: 3px; font-weight: bold;",
          targets:"#childwarp",
          align: "center",
        };
    cssWarp(childWarp);

    // Set the width of edit-in-place input fields to fit their content for view centering 
    $scope.getTextWidth = function(font, text, angularEl, isSchoolName) {
      var canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement("canvas")),
      context = canvas.getContext("2d");
      context.font = font;
      if(text && text.indexOf("/") > -1){
         text = text.substring(0, text.lastIndexOf('/'));
      }
      var metrics = context.measureText(text);
      angularEl.css('width', (metrics.width + 3) + 'px');
      angularEl.children().eq(0).css('width', (metrics.width + 3) + 'px');
    };

    $scope.hideEditIcon = function(e){
      var nameInput = angular.element(e.currentTarget);
      $scope.editIcon = nameInput.parent().parent().next();
      $scope.editIcon.css('display', 'none');
    };

    $scope.showEditIcon = function(){
      $scope.editIcon.css('display', 'inline');
      $scope.editIcon = null;
      delete $scope.editIcon;
    };

    $scope.getTextWidth(userName.attr('font'), $scope.user.name, userName);
    
    if($scope.user.school){
      $scope.hideDisplayName = false;
    } else {
      $scope.hideDisplayName = true;
    }

    $scope.editSchool = function(){
      if($scope.hideDisplayName){
        $scope.hideDisplayName = false;
      } else {
        $scope.hideDisplayName = true;
      }
    };
    if($scope.hideDisplayName){
      $timeout(function(){
        var schoolAutoComplete = angular.element(document.getElementsByClassName('layout-row')[0]),
            icon = angular.element(document.createElement('i'));
        icon.html('<span>EDIT</span>');
        icon.addClass('icon ion-edit');
        schoolAutoComplete.append(icon);
      });
    }    
    //handle submits
    $scope.editSubmit = function(modelValue, prop){
      var userId = $scope.user.user_id,
          userRef = ref.child('users').child(userId),
          schools = $firebaseArray(schoolsRef),
          obj = {};
      if(!prop && modelValue){// We're adding a school
        var school = schools.$getRecord(modelValue['NCESSCH']); //jshint ignore: line
        if(school){// If the school is already there
          obj['school'] = modelValue['NCESSCH']; //jshint ignore: line
        } else {
          angular.forEach(modelValue, function(value, key){
            switch(key){
              case "SCHNAM09":
                obj['name'] = value; //jshint ignore: line
                break;
              case "PHONE09":
                obj['phone'] = value; //jshint ignore: line
                break;
              case "MSTREE09":
                obj['street_address'] = value; //jshint ignore: line
                break;
              case "MCITY09":
                obj['city'] = value; //jshint ignore: line
                break;
              case "MSTATE09":
                obj['state'] = value; //jshint ignore: line
                break;
              case "MZIP09":
                obj['zip'] = value; //jshint ignore: line
                break;
              case "LATCOD09":
                obj['lat'] = value; //jshint ignore: line
                break;
              case "LONCOD09":
                obj['lon'] = value; //jshint ignore: line
                break;
            }
          });
        }
        schoolsRef.child(modelValue['NCESSCH']).set(obj); //jshint ignore: line
        userRef.update({school: modelValue['NCESSCH']}); //jshint ignore: line
        $firebaseObject(schoolsRef.child(modelValue['NCESSCH'])) //jshint ignore: line
        .$loaded().then(function(school){// Load the user's new school
          $scope.school = school;
          $scope.getTextWidth(schoolName.attr('font'), school.name, schoolName);
        });
      } else if(modelValue) {
        obj[prop] = modelValue;
        userRef.update(obj);
      }
      $scope.hideDisplayName = false;
    };

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
    if(!$scope.user.pic && $scope.user.name){
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
    
    $scope.addChild = function(){
      childrenRef.push({
        name: 'Child\'s name?',
        grade: 13,
        pic: '?'
      });
    };

    $scope.removeChild = function(key) {
      var child = $firebaseObject(childrenRef.child(key)),
          childName;
      child.$loaded()
      .then(function(child){
        if(child.name === "Child's name?"){
          childName = "this child";
        } else {
          childName = child.name;
        }
        var confirmPopup = $ionicPopup.confirm({
         title: 'Confirm Delete',
         subTitle: 'This action cannot be undone.',
         template: 'Are you sure you want to delete ' + childName +'?',
         cancelType: 'button-balanced',
         okText: 'Delete',
         okType: 'button-assertive'
        });

        confirmPopup.then(function(res) {
         if(res) {
           childrenRef.child(key).remove();
         }
        });
      });
    };

    $ionicModal.fromTemplateUrl('crop-image.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.imageModal = modal;
    });

    $scope.cropImageModal = function() {
        $scope.imageModal.show();
    };

    $scope.$on('$destroy', function() {
      if($scope.childModal){
        $scope.childModal.remove();
      } else {
        $scope.imageModal.remove();
      }
    });

    $scope.openModal = function(name){
      $scope.imageModal.show();
    };

    $scope.closeModal = function(name) {
      $scope.imageModal.hide();
    };
  
    //image pick & crop
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
       console.log(error);
      });
    };

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
        return error;
      });
    };

    $scope.storeImage = function(file){
      var imageDataArray = file.split(','),
          binary = window.atob(imageDataArray[1]),
          array = new Uint8Array(binary.length),
          storageRef = firebase.storage().ref(),
          urlSavePath,
          storagePath;
      for( var i = 0; i < binary.length; i++ ) { 
        array[i] = binary.charCodeAt(i); 
      }
      var image = new Blob([array]);
      if($scope.childPath){
        var childIndex = $scope.childPath.split('/')[1];
        urlSavePath = $scope.childPath;
        storagePath = 'profile_pics/children/' + $scope.user.user_id + childIndex +'.jpg';
      } else {
        urlSavePath = 'pic';
        storagePath = 'profile_pics/' + $scope.user.user_id +'.jpg';
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
            $scope.editSubmit(uploadTask.snapshot.downloadURL, urlSavePath);
            $scope.closeModal();
            if($scope.childPath){// Cleanup the path of the saved child
              delete $scope.childPath;
            }

          }
        });
      });
    };

    $ionicSideMenuDelegate.canDragContent(true);
}]);


