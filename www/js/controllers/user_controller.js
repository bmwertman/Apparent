Pta.controller('UserCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  '$ionicModal',
  '$ionicPopup',
  '$cordovaImagePicker',
  '$filter',
  '$timeout',
  '$stateParams',
  '$http',
  '$firebaseArray',
  '$firebaseObject',
  '$ionicHistory',
  '$rootScope',
  'Auth',
  'userService',
  function($scope, $ionicSideMenuDelegate, $ionicModal, $ionicPopup, $cordovaImagePicker, $filter, $timeout, $stateParams, $http, $firebaseArray, $firebaseObject, $ionicHistory, $rootScope, Auth, userService) {
    // Future work - Add child's current teacher to their parent's profile
    var ref = firebase.database().ref(),
        userId = firebase.auth().currentUser.uid,
        userRef = ref.child('users').child(userId),
        userObj = $firebaseObject(userRef);
        user = userObj.$loaded(function(loadedUser){
          loadedUser.$bindTo($scope, "user");
          return loadedUser;
        }),
        schoolsRef = ref.child('schools'),
        childrenRef = ref.child('users/' + userId + '/children'),
        userName = angular.element(document.getElementById('name-wrap')),
        childWarp = {
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

    $scope.grades = { 'K': 0, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10, '11th': 11, '12th': 12, '?': 13 };
    $scope.showFooter = true;
    $scope.showEmail = true;
    $scope.showPhone = true;

    cordova.plugins.Keyboard.disableScroll(false);
    var footer = angular.element(document.getElementById('profile-footer'));
    $scope.hideContact = function(contact){
      footer.css('height', '40px');
      if(contact === 'phone'){
        $scope.showPhone = false
      } else if(contact === 'email'){
        $scope.showEmail = false;
      } else {
        $scope.showPhone = false;
        $scope.showEmail = false;
        footer.css('height', '0px');
      }
    }

    window.addEventListener('native.keyboardshow', function() {
      $scope.showFooter = false;
      $timeout(function(){
        $scope.$apply();
      });
    });

    window.addEventListener('native.keyboardhide', function() {
      $scope.showFooter = true;
      $scope.showEmail = true;
      $scope.showPhone = true;
      footer.css('height', '100px');
      $timeout(function(){
        $scope.$apply();
      });
    });

    // Hack fix to prevent multiple triggers of $onAuthStateChange from redirecting back to the verify view
    var stateChangeListener = $rootScope.$on('$stateChangeStart', function(e, toState){
      if(toState === 'verify'){
        e.preventDefault();
      } else {
        stateChangeListener();
      }
    });

    function setSchoolName(schoolId){
      $firebaseObject(schoolsRef.child(schoolId))
      .$loaded()
      .then(function(school){// Load the user's new school
        $scope.school = school;// Set the retrieved firebase school Object on local $scope
        var schoolName = angular.element(document.getElementById('school-name'));// get the school name element
        $scope.getTextWidth(schoolName.attr('font'), school.name, schoolName);// Adjust the input's width to fit the school name
      });
    }

    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
      viewData.enableBack = true;
    }); 

    //handle submits
    $scope.editSubmit = function(modelValue, prop, user){
      var obj = {},
          user;
      if(!prop && modelValue){// We're adding a school
        $firebaseArray(schoolsRef)
        .$loaded()
        .then(function(schools){
          var school = schools.$getRecord(modelValue['NCESSCH']);
          if(!school){// If this is the first user at this school
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
            schoolsRef.child(modelValue['NCESSCH']).set(obj);
            // Make them the default admin
            $scope.user.isAdmin = true;
          }
          $scope.user.school = modelValue['NCESSCH'];
          user = $scope.user;
          delete user.$id;
          delete user.$priority
          userRef.set(user)
          .then(function(){
            userService.setUser(user);
            setSchoolName(modelValue['NCESSCH']);
          })
          .catch(function(error){
            if(error.code === "PERMISSION_DENIED"){
              Auth.verifyEmail();
            }
          });
        });
      } else if(modelValue) {
        var propArr = prop.split('/');
        if(propArr[0] === "children"){
          $scope.user[propArr[0]][propArr[1]][propArr[2]] = modelValue;
        } else {
          $scope.user[prop] = modelValue;
        }
        user = $scope.user;
        delete user.$id;
        delete user.$priority
        userRef.set(user);
      }
    };

    $timeout(function(){
      if($scope.user.school){ // Load the user's school
        $firebaseObject(schoolsRef.child($scope.user.school))
        .$loaded().then(function(school){
          $scope.school = school;
          var schoolName = angular.element(document.getElementById('school-name')), 
          schoolInputParent = schoolName.children().eq(0),
          name = schoolInputParent.children().eq(0);
          name.val(school.name);
          $scope.getTextWidth(schoolName.attr('font'), school.name, schoolName);
        });
      }
    });
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

    // Set the width of edit-in-place input fields to fit their content for view centering 
    $scope.getTextWidth = function(font, text, angularEl) {
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

    $scope.getTextWidth(userName.attr('font'), user.name, userName); 

    if($scope.hideDisplayName){
      $timeout(function(){
        var schoolAutoComplete = angular.element(document.getElementsByClassName('layout-row')[0]),
            icon = angular.element(document.createElement('i'));
        icon.html('<span>EDIT</span>');
        icon.addClass('icon ion-edit');
        schoolAutoComplete.append(icon);
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

    $ionicModal.fromTemplateUrl('templates/circular-crop.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.cropImageModal = function() {
        $scope.modal.show();
    };

    $scope.$on('$destroy', function() {
      if($scope.childModal){
        $scope.childModal.remove();
      } else {
        $scope.modal.remove();
      }
    });

    $scope.openModal = function(name){
      $scope.modal.show();
    };

    $scope.closeModal = function(name) {
      $scope.modal.hide();
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
        if(results.length > 0){
          $scope.picFile = results[0];
          $scope.cropImageModal();
        }
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

    function imageSave(ref, path, img, urlPath){
      var uploadTask = ref.child(path).put(img);
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
            $scope.editSubmit(uploadTask.snapshot.downloadURL, urlPath);
            $scope.closeModal();
            if($scope.childPath){// Cleanup the path of the saved child
              delete $scope.childPath;
            }
        }
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
        array[i] = binary.charCodeAt(i);
      }
      var image = new Blob([array]);
      if($scope.childPath){
        var childIndex = $scope.childPath.split('/')[1];
        urlSavePath = $scope.childPath;
        storagePath = 'profile_pics/children/' + userId + childIndex +'.jpg';
      } else {
        urlSavePath = 'pic';
        storagePath = 'profile_pics/' + userId +'.jpg';
      }
      var uploadTask = storageRef.child(storagePath);
      uploadTask.getDownloadURL()
      .then(function(onResolved){// Ensure we're only storing one profile pic per user
        uploadTask.delete()
        .then(function(){
          imageSave(storageRef, storagePath, image, urlSavePath);
        }).catch(function(error){
          if(error.code === "storage/object-not-found"){
            imageSave(storageRef, storagePath, image, urlSavePath);
          }
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


