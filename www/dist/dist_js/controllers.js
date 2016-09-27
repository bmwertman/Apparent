Pta.controller('HomeCtrl', [
  '$scope',
  'userService',
  '$firebaseObject',
  '$timeout',
  '$state',
  '$ionicNavBarDelegate',
  function($scope, userService, $firebaseObject, $timeout, $state, $ionicNavBarDelegate) {
    
    $ionicNavBarDelegate.align('center');

    $scope.user = userService.getUser();
    if($scope.user.school){
      var school = $firebaseObject(firebase.database().ref('schools').child($scope.user.school));
      school.$loaded(function(school){
        $scope.school = school;
      });
    } else {
      var nameArr = $scope.user.name.split(' ');
      $scope.school = {};
      $scope.school.name = "Welcome " + nameArr[0];
    }
}]);



Pta.controller('LoginCtrl', [
  '$scope',
  '$ionicModal',
  '$ionicPopup',
  '$timeout',
  '$ionicLoading',
  '$localstorage',
  'Auth',
  '$state',
  function($scope, $ionicModal, $ionicPopup, $timeout, $ionicLoading, $localstorage, Auth, $state) {

  $scope.openSignup = function(){
    $state.go('signup');
  };

  // Form data for the login view
  $scope.credentials = {};
  
  // Log in using firebase's login API
  $scope.doLogin = function () {
    $scope.errorMessage = null;
    $ionicLoading.show({ template: '<ion-spinner></ion-spinner>'});
    Auth.login($scope.credentials);
    $ionicLoading.hide();
  };

  var emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
  $scope.resetError = function(){ 
    $scope.emailBlank = false; 
  };
  $scope.invalidEmail = false;
  $scope.confirmReset = function(){
    $scope.data= {};
    var confirmResetPopup = $ionicPopup.show({
      template: "<input type='email' placeholder='Enter email' ng-keyup='resetError()' ng-model='data.resetEmail'><br><p ng-show='invalidEmail' class='email-valid'>Please enter a valid email</p>",
      title: "Reset password",
      cssClass: "reset-popup",
      subTitle: "Would you like a reset email sent?",
      scope: $scope,
      buttons:[
        { text: "Cancel",
          type: "button-stable"
        },
        { text: "<b>Send</b>",
          type: "send",
          onTap: function(e){
            if(!emailRegex.test($scope.data.resetEmail)){
              e.preventDefault();
              $scope.invalidEmail = true;
            } else {
              Auth.passwordReset($scope.data.resetEmail);
            } 
          }
        }
      ]
    });
  };
  if(navigator.splashscreen){
    navigator.splashscreen.hide();
  }

}]);
// .directive('shakeThat', ['$animate', function($animate) {
//   return {
//     require: '^form',
//     scope: {
//       submit: '&',
//       submitted: '='
//     },
//     link: function(scope, element, attrs, form) {
//       // listen on submit event
//       element.on('submit', function() {
//         // tell angular to update scope
//         scope.$apply(function() {
//           // everything ok -> call submit fn from controller
//           if (form.$valid) return scope.submit();
//           // show error messages on submit
//           scope.submitted = true;
//           // shake that form
//           $animate.addClass(element, 'shake', function() {
//             $animate.removeClass(element, 'shake');
//           });
//         });
//       });
//     }
//   };

// }]);
Pta.controller('EventsCtrl', [
  '$scope', 
  '$ionicSideMenuDelegate', 
  '$firebaseArray',
  '$state',
  '$ionicPopup',
  'userService',
  function($scope, $ionicSideMenuDelegate, $firebaseArray, $state, $ionicPopup, userService) {

  $ionicSideMenuDelegate.canDragContent(true);

  // Get the event data from firebase as an array
  var ref = firebase.database().ref();
  var eventsRef = ref.child('events').orderByChild('date');
  $scope.calEvents = $firebaseArray(eventsRef);
  $scope.user = userService.getUser();

  if(!$scope.user.school || $scope.user.school === ""){
    var noSchoolAlert = $ionicPopup.alert({
      title: 'You haven\'t set your school',
      subTitle:"Apparent connects you with events at your child's school.",
      template: "Add your child's school on your profile to see what is happening!",
      okText: "Set School",
      okType: "button-balanced"
    });
    noSchoolAlert.then(function(res){
      $state.go('app.profile');
    });
  }
  
  $scope.showEvent = function(event){
    $state.go('app.calendar',{selectedEvent: event});
  };
  
  $scope.volunteersNeeded = [];

  $scope.roles = ["Setup", "Event", "Cleanup"];

  for (var i = $scope.roles.length - 1; i >= 0; i--) {
    var role = {};
    role.name = $scope.roles[i];
    $scope.volunteersNeeded.push(role);
  }
  
  $scope.volunteersNeeded.unshift({name: 'All'});
  
}]);



Pta.controller('SignupCtrl', [
  '$scope',
  '$ionicSideMenuDelegate',
  'Auth',
  '$ionicLoading',
  '$firebaseArray',
  '$state',
  function($scope, $ionicSideMenuDelegate, Auth, $ionicLoading, $firebaseArray, $state) {

  $ionicSideMenuDelegate.canDragContent(true);
  $scope.newUser = {};
  
  $scope.signupSubmit = function() {
    $ionicLoading.show({ template: '<ion-spinner></ion-spinner>', duration: 2000});
    // Create new user in firebase
    Auth.createUser($scope.newUser.email, $scope.newUser.password)
    .then(function(userData) {
      // Log in this newly created user
      return Auth.login($scope.newUser.email, $scope.newUser.password);
    }).then(function(authData) {
      // If the user is now created and logged in, then add the user's
      // info into firebase
      // Add the unique ID firebase assigns to the user (this will be helpful 
      // as you build out more features)
      var userProfile = { name: $scope.newUser.name,
                          email: $scope.newUser.email,
                          user_id: authData.uid,
                          isAdmin: false 
                        },
          ref = firebase.database().ref(),
          usersRef = ref.child('users').child(authData.uid);
      usersRef.update(userProfile);
      $ionicLoading.hide();
      $state.go('app.profile');
    }).catch(function(error) {
      console.error("Error: ", error);
      $scope.errorMessage = error.message;
    });
  };
}]);



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



Pta.controller('CalendarCtrl', [
  '$scope', 
  '$ionicLoading', 
  '$timeout', 
  '$state',
  '$ionicModal',
  '$ionicPopup',
  '$ionicSideMenuDelegate',
  '$firebaseArray',
  '$stateParams',
  '$compile',
  '$localstorage',
  '$ionicPlatform',
  'Rooms',
  'userService',
  '$firebaseObject',
  function ($scope, $ionicLoading, $timeout, $state, $ionicModal, $ionicPopup, $ionicSideMenuDelegate, $firebaseArray, $stateParams, $compile, $localstorage, $ionicPlatform, Rooms, userService, $firebaseObject) {
  'use strict';

  $scope.selectedEvent = $stateParams.selectedEvent;
  $ionicSideMenuDelegate.canDragContent(false);

  if($stateParams.selectedEvent && $stateParams.selectedEvent.cleanup_start){
    $scope.currentDate = new Date($stateParams.selectedEvent.cleanup_start);
  } else if($stateParams.selectedEvent && $stateParams.selectedEvent.event_start) {
    $scope.currentDate = new Date($stateParams.selectedEvent.event_start);
  } else {
    $scope.currentDate = new Date();
  }

  var user = userService.getUser();

  $scope.calendarTitle = $stateParams.calendarTitle;
  $scope.isVolunteerSignup = $stateParams.isVolunteerSignup;

  $scope.itemSelected = {};
  $scope.eventTypes = [
    {type: 'all', label: 'All'},
    {type: 'setup', label: 'Setup'},
    {type: 'event', label: 'Event'},
    {type: 'cleanup', label: 'Cleanup'}
  ];

  $scope.reloadEvents = function(){
    $scope.$broadcast('eventFilter', $scope.itemSelected.type);
  };

  // Get the event data from firebase as an array
  var ref = firebase.database().ref();
  var eventsRef = ref.child('events');
  $scope.calEvents = $firebaseArray(eventsRef);

  // $ionicModal.fromTemplateUrl('templates/edit_event.html', {
  //   scope: $scope,
  //   animation: 'slide-in-up'
  // }).then(function(modal) {
  //   $scope.modal = modal;
  // });

  $ionicModal.fromTemplateUrl('add_event.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.eventModal = modal;
  });

  $scope.addEventModal = function() {
      $scope.eventModal.show();
  };

  $scope.$on('$destroy', function(){
      $scope.eventModal.remove();
  });

  $scope.closeModal = function() {
      $scope.eventModal.hide();
      $scope.event = {};
  };

  //save confirmation post submit
  $scope.saved = function(data, cb) {
    $ionicLoading.show({
      template: data + ' has been saved.',
      duration: 2300
    });
  };

  //error message display
  $scope.err = function(err, lineNumber) {
    $ionicLoading.show({
      template: 'The save failed with error ' + err.status + '.Line ' + lineNumber + ', CheckinCtrl.',
      duration: 4000
    });
  };
  
  $scope.deleted = function(){
    $ionicLoading.show({
      template: 'Job Succesfully Deleted',
      duration: 2300
    });
  };

  $scope.isDragging = true;

  $scope.mode = 'day';

  $scope.changeMode = function (mode) {
    $scope.mode = mode;
  };

  $scope.today = function () {
      $scope.currentDate = new Date();
  };

  $scope.isToday = function () {
    var today = new Date(),
    currentCalendarDate = new Date($scope.currentDate);
    today.setHours(0, 0, 0, 0);
    currentCalendarDate.setHours(0, 0, 0, 0);
    return today.getTime() === currentCalendarDate.getTime();
  };

  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+ minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

  function getTimeOffset(date) {
    var minutes = date.getMinutes();
    var percentOfHour = (minutes / 60) * 100; 
    return percentOfHour;
  }

  function getApptTime(startTime, endTime) {
    var totalDifference = endTime - startTime;
    var convertToMins = totalDifference / 1000 / 60 / 60;
    return convertToMins;
  }

  $scope.parseTime = function (timeStr, dt) {
    if (!dt) {
        dt = new Date();
    }

    var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
    if (!time) {
        return NaN;
    }
    var hours = parseInt(time[1], 10);
    if (hours == 12 && !time[3]) {
        hours = 0;
    }
    else {
        hours += (hours < 12 && time[3]) ? 12 : 0;
    }

    dt.setHours(hours);
    dt.setMinutes(parseInt(time[2], 10) || 0);
    dt.setSeconds(0, 0);
    return dt;
  };

  $scope.$on('displayTimes', function(e, displayStart, displayEnd){
    $scope.displayStart = displayStart;
    $scope.displayEnd = displayEnd;
  });

  $scope.inputHidden = function(){
    if($scope.selectedTime.id === 0){
      return "hidden-input";
    }
  };

  $scope.timeValue = null;
  $scope.items = [{
        id: 0,
        name: "Time unit options",
        label: "Choose a time unit"
    },{
        id: 1,
        name: "Minutes",
        label: "How many minutes before?"
    },{
        id: 60,
        name: "Hours",
        label: "How many hours before?" 
    },{
        id: 1440,
        name: "Days",
        label: "How many days before?"
    },{
        id: 10080,
        name: "Weeks",
        label: "How many weeks before?"
  }];
  $scope.selectedTime = $scope.items[0];

  var timeInputWatch = $scope.$watch('timeValue', function(newValue, oldValue) {
      if(newValue && newValue !== 0){// The user has set a time value
          var popupTitle = angular.element(document.getElementsByClassName('popup-title'));
          // Swap the "Add Reminder?" title for an "Add another reminder?" button
          $scope.secondNotificationBtn = $compile('<button id="add-another-btn" ng-click="addAnotherNotification()">Add another reminder?</button>')($scope);
          popupTitle.replaceWith($scope.secondNotificationBtn);
          timeInputWatch();
          $scope.$watch('timeValue', function(newValue, oldValue) {
             $localstorage.set('secondReminderMinutes', ($scope.timeValue * $scope.selectedTime.id));
          });
      }
      // else if(newValue && newValue != 0 && $scope.secondReminderMinutes) {// User clicked add another notification
      //   angular.element(document.getElementsByClassName('notification-ctrl')).css({display:'none'});
      //   var popupButtons = angular.element(document.getElementsByClassName('popup-buttons'));
      //   popupButtons.children().eq(popupButtons.children.length - 1).css({color: "rgba(255, 255, 255, 1)", boxShadow: "0 5px 15px rgba(51, 201, 95, .4)"});
      // }
  });

  $scope.$watch('selectedTime', function(newValue, oldValue){
    $scope.selectedTime = newValue;
  });

  $scope.addAnotherNotification = function(){// Hide the button, reset the form
      angular.element($scope.secondNotificationBtn).remove();
      $localstorage.set('firstReminderMinutes', ($scope.timeValue * $scope.selectedTime.id));
      $scope.timeValue = null;
      $scope.selectedTime = $scope.items[0];
  };

  function addToChat(){
    var roomId = $scope.selectedEvent.$id + '-group',
        eventRoomRef = ref.child('event-rooms').child($scope.selectedEvent.$id).child(roomId),
        eventRoom = $firebaseObject(eventRoomRef),
        chatter = { email: user.email, id: user.$id, name: user.name, pic: user.pic },
        newChatterKey = eventRoomRef.child('chatters').push().key,
        updates = {};
    // Subscribe the user to push notifications for this room
    // FCMPlugin.subscribeToTopic(roomId);
    // This adds the volunteer to the group chat room referenced by admin interact view when the admin wants to chat all volunteers
    updates['/event-rooms/' + $scope.selectedEvent.$id + '/' + roomId + '/chatters/' + newChatterKey] = chatter;
    // This adds the group chatter to the group chat in the general rooms 
    updates['/rooms/' + roomId + '/chatters/' + newChatterKey] = chatter;  
    ref.update(updates)
    .then(function(){
      eventRoom.$loaded().then(function(eventRoom){
        var updates = {};
        angular.forEach(eventRoom.chatters, function(currentChatter, chatterKey){
          var newChatter = { email: user.email, id: user.$id, name: user.name, pic: user.pic };
          // Updates the current volunteers' & event organizer's user-rooms w/ the new chatter/new volunteer
          if(currentChatter.id !== user.$id){ // This isn't the new chatter/new volunteer
            updates['/user-rooms/' + currentChatter.id + '/' + roomId + '/chatters/' + newChatterKey ] = newChatter;
          }
        });
        var newEventRoom = {
          chatters: eventRoom.chatters,
          owner: eventRoom.owner,
          subject: eventRoom.subject,
        };
        if(eventRoom.title){
          newEventRoom.title = eventRoom.title;
        }
        updates['/user-rooms/' + user.$id + '/' + roomId] = newEventRoom;

        ref.update(updates);
      });
    });
  }

  $scope.createCalEvent = function(){
    var startDate = $scope.parseTime($scope.displayStart, new Date($scope.selectedEvent.date)).toString(),
        endDate = $scope.parseTime($scope.displayEnd, new Date($scope.selectedEvent.date)).toString(),
        eventRef = eventsRef.child($scope.selectedEvent.$id),
        currentVolunteers = $firebaseArray(eventRef.child('volunteers')),
        volunteer = { id: user.$id, start: startDate, end: endDate };
    currentVolunteers.$loaded()
    .then(function(volunteers){
      //Make sure a previous volunteer isn't adding more time
      if(volunteers.length > 0){
        for (var i = volunteers.length - 1; i >= 0; i--) {
          if(volunteers[i].id === user.$id){//Only add them to the volunteers
            break;
          } else if(i <= 0){//Add them to volunteers and chat
            addToChat();
          }
        }
      } else {
        addToChat();
      }
      volunteers.$add(volunteer)
      .then(function(){
        if($localstorage.get('firstReminderMinutes')){
          var calOptions = window.plugins.calendar.getCalendarOptions(); 
          calOptions.firstReminderMinutes = $localstorage.get('firstReminderMinutes');
          calOptions.secondReminderMinutes = $localstorage.get('secondReminderMinutes');
          var title = $scope.selectedEvent.event_title,
              eventLocation = $scope.selectedEvent.location,
              notes = null;
          window.plugins.calendar.createEventWithOptions(
              title,
              eventLocation,
              notes,
              startDate,
              endDate,
              calOptions,
            function (result) {
              var alert = $ionicPopup.alert({
                 title: '<b>Thanks!</b>',
                 template: '<div style="text-align:center;">You\'re child\'s school is better because of people like you.</div>',
                 buttons: []
              });
              $timeout(function(){
                 alert.close();
                 $state.go('app.events');
              }, 3000); 
            }, 
            function (err) {
             console.log('Error: '+ err);
            });
          $localstorage.remove('firstReminderMinutes');
          $localstorage.remove('secondReminderMinutes');
        } else {
          var alert = $ionicPopup.alert({
             title: '<b>Thanks!</b>',
             template: '<div style="text-align:center;">You\'re child\'s school is better because of people like you.</div>',
             buttons: []
          });
          $timeout(function(){
             alert.close();
             $state.go('app.events');
          }, 3000); 
        }
      });
    });
  };

  $scope.confirmSignup = function() {
      var confirmPopup = $ionicPopup.confirm({
          title: '<b style="text-align:center;">You\'re signing up to help your child\'s school!</b>' ,
          template: '<div style="text-align:center;">Are you sure you\'re available from<br><b>' + 
                    $scope.displayStart + '</b> to <b>' + $scope.displayEnd +'</b><br> on <b>' + 
                    moment($scope.selectedEvent.date).format('dddd MMMM Do') + '</b>?</div>',
          cancelText: 'No',
          cancelType: 'button-assertive',
          okText: 'Yes',
          okType: 'button-balanced'     
      });
      confirmPopup.then(function(res){// Are they sure they want to sign up?
          if(res) {// They're sure!
              var volunteerHours = moment($scope.parseTime($scope.displayEnd)).diff($scope.parseTime($scope.displayStart), 'hours'),
                  selectedEventRef = firebase.database().ref('events').child($scope.selectedEvent.$id),
                  count = 0,
                  coveredHours;
              // Deduct the hours just volunteered from the total volunteer hours needed.
              $scope.selectedEvent.volunteer_hours = $scope.selectedEvent.volunteer_hours - volunteerHours;
              if($scope.selectedEvent.covered_hours){
                coveredHours = $scope.selectedEvent.covered_hours + volunteerHours;
              } else {
                coveredHours = volunteerHours;
              }
              selectedEventRef.update({covered_hours: coveredHours});

              $scope.createReminders = $ionicPopup.show({
                  title: 'Add a reminder?',
                  templateUrl: 'set-notification.html',
                  buttons:[
                      { 
                          text: 'No Thanks',
                          type: 'button-assertive',
                          onTap: function(){
                              if(count === 0){//Hack fix because onTap kept calling createEvent() twice
                                count++;
                                $scope.createCalEvent();// Just adds them to the chat room
                              }
                          }
                      },{
                          text: 'Add Reminder(s)',
                          type: 'button-balanced',
                          onTap: function(e){
                            if(count === 0){
                              count++;
                              $scope.createCalEvent();// If they setup reminders it gets them info from $localstorage
                            }
                          }
                      }
                  ]
              });                       
          } else {// Changed their mind.
              var alert = $ionicPopup.alert({
                  title: '<b>Aaaawww, we really need you.</b>',
                  template: '<div style="text-align:center;>">Maybe another time?</div>',
                  buttons: []
              });
              $timeout(function(){
                  alert.close();
              }, 3000); 
          }
      });
  };

  $scope.event = {};
  $scope.$on('timeSelected', function(eventTimes){
    $scope.event = eventTimes.targetScope.event;
    $scope.addEventModal();
  });

  $scope.eventSelected = function(calEvent){
      if($scope.isCalView){// If this isn't the volunteer signup view;
          $scope.event.start_date = calEvent.event.start_time;
          $scope.event.end_date = calEvent.event.end_time;
          $scope.event.start_time = calEvent.event.start_time;
          $scope.event.end_time = calEvent.event.end_time;
          $scope.event.event_title = calEvent.event.title;
          $scope.location = {};
          $scope.location.formatted_address = calEvent.event.location;
          $scope.eventModal.show();
      }
  };

  $scope.hasSetup = function(){
      if($scope.event.setup_volunteers_needed && $scope.event.setup_volunteers_needed !== 0){
          $scope.event.setup_start_time = moment($scope.event.start_time).subtract(2, 'hours')._d;
          $scope.event.setup_end_time = $scope.event.start_time;
          $scope.event.setup_start_date = $scope.event.start_date;
          $scope.event.setup_end_date = $scope.event.start_date;
      }
  };

  $scope.hasCleanup = function(){
      if($scope.event.cleanup_volunteers_needed && $scope.event.setup_volunteers_needed !== 0){
          $scope.event.cleanup_end_time = moment($scope.event.end_time).add(2, 'hours')._d;
          $scope.event.cleanup_start_time = $scope.event.end_time;
          $scope.event.cleanup_start_date = $scope.event.start_date;
          $scope.event.cleanup_end_date = $scope.event.start_date;
      }
  };

  $ionicPlatform.onHardwareBackButton(function(){
      $scope.event.setup_volunteers_needed = null;
      $scope.event.volunteers_needed = null;
      $scope.event.cleanup_volunteers_needed = null;
  });

  $scope.$on('selectedLocation', function(e){
      $scope.event.location = e.targetScope.location.formatted_address;
  });

  $scope.saveEvent = function(e, event){
      e.preventDefault();
      e.stopPropagation();
      $scope.event.event_start = moment(moment($scope.event.start_date).format('ddd, MMM DD, YYYY') + " " + moment($scope.event.start_time).format('hh:mm a'))._d.toString();
      $scope.event.event_end = moment(moment($scope.event.start_date).format('ddd, MMM DD, YYYY') + " " + moment($scope.event.end_time).format('hh:mm a'))._d.toString();
      if($scope.event.setup_start_date){
          $scope.event.setup_start = moment(moment($scope.event.setup_start_date).format('ddd, MMM DD, YYYY') + " " + moment($scope.event.setup_start_time).format('hh:mm a'))._d.toString();
          $scope.event.setup_end = moment(moment($scope.event.setup_start_date).format('ddd, MMM DD, YYYY') + " " + moment($scope.event.setup_end_time).format('hh:mm a'))._d.toString(); 
      }
      if($scope.event.cleanup_start_date){
          $scope.event.cleanup_start = moment(moment($scope.event.cleanup_start_date).format('ddd, MMM DD, YYYY') + " " + moment($scope.event.cleanup_start_time).format('hh:mm a'))._d.toString();
          $scope.event.cleanup_end = moment(moment($scope.event.cleanup_start_date).format('ddd, MMM DD, YYYY') + " " + moment($scope.event.cleanup_end_time).format('hh:mm a'))._d.toString();
      }
      if($scope.event.setup_volunteers_needed || $scope.event.cleanup_volunteers_needed || $scope.event.volunteers_needed){
          $scope.event.volunteer_hours = moment($scope.event.setup_end).diff($scope.event.setup_start, 'hours') * $scope.event.setup_volunteers_needed + moment($scope.event.event_end).diff($scope.event.event_start, 'hours') * $scope.event.volunteers_needed + moment($scope.event.cleanup_end).diff($scope.event.cleanup_start, 'hours') * $scope.event.cleanup_volunteers_needed;  
      }
      
      // This is needed to order the events chronologically in the view
      $scope.event.date = $scope.event.start_date.getTime();
      var eventId = eventsRef.push($scope.event).key;
      // Create a group chat room unde the event-rooms/<eventId> w/ the admin who created the event in the room
      event.id = eventId;
      Rooms.addNewRoom([], '/event-rooms/', eventId + '-group', event);
      $scope.saved(event.title, $scope.closeModal());
      
      if(user.isAdmin){
          $state.go('app.calendar');
      } else {
          $state.go('app.volunteer');
      }   
  };

}]);
Pta.controller('MenuCtrl', [
  '$scope',
  'Auth',
  '$state',
  function($scope, Auth, $state) {
    $scope.logout = function(){
      Auth.logout();
    };
    $scope.goBack = function(){
      $state.go('app.home');
    };
}]);



Pta.controller('ChatCtrl', [
    '$scope',
    'Chats',
    '$state',
    '$timeout',
    '$ionicScrollDelegate',
    'userService',
    'dateFilter',
    '$http',
    function ($scope, Chats, $state, $timeout, $ionicScrollDelegate, userService, dateFilter, $http) {
    $scope.IM = { textMessage: "" };
    $scope.user =  userService.getUser();
    $scope.data = {};

    $scope.slide = function(e){
        var userChats = angular.element(document.getElementsByClassName('user')),
            times = angular.element(document.getElementsByClassName('time')),
            Usertimes = angular.element(document.getElementsByClassName('user-time'));
        if(e.type === "swiperight"){
            times.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(72px, 0, 0)'});
            Usertimes.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(72px, 0, 0)'});
            userChats.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(72px, 0, 0)'});
            userChats.attr({'style': ''});
        } else {
            times.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(-72px, 0, 0)'});
            Usertimes.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(-72px, 0, 0)'});
            userChats.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(-72px, 0, 0)'});
        }
    };

    Chats.selectRoom($state.params.roomId);
    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS(),
        selectedRoom = Chats.getSelectedRoomName(),
        chatters = $state.params.chatters;

    selectedRoom.$loaded()
    .then(function(){
        if (selectedRoom) {
            // Fetching Chat Records only if a Room is Selected
            $scope.$emit('subject', selectedRoom.subject);
            // Add room titles
            var titleArr = [];
            angular.forEach(selectedRoom.chatters, function(chatter, key){
                if(chatter.id !== $scope.user.$id){
                  titleArr.push(' ' + chatter.name.split(' ')[0]);
                } 
            });
            $scope.roomName = titleArr.join();
            $scope.chats = Chats.all();
        } else {
            $scope.chats = [];
        }
    });

    $scope.sendMessage = function() {
        // Get the users auth jwt to verify them on the node server 
        firebase.auth().currentUser.getToken(true)
        .then(function(userToken){
            $http({
                method: 'POST',
                url:'https://murmuring-fjord-75421.herokuapp.com/',
                data:{ 
                    token: userToken,
                    message: $scope.IM.textMessage,
                    sender_name: $scope.user.name,
                    topic: '/topics/' + $state.params.roomId,
                    state: 'app.room',
                    roomId: $state.params.roomId,
                    sender_imgURL: $scope.user.pic,
                    chatters: chatters 
                }
            })
            .then(function(res){
                Chats.send($scope.user, $scope.IM.textMessage);
                $scope.IM.textMessage = "";
                $ionicScrollDelegate.scrollBottom(true);
            })
            .catch(function(err){
                console.log(err);
            });
        });
    };

    // $scope.inputUp = function() {
    //     if (isIOS) $scope.data.keyboardHeight = 216;
    //         $timeout(function() {
    //         $ionicScrollDelegate.scrollBottom(true);
    //     }, 300);
    // };

    // $scope.inputDown = function() {
    //     if (isIOS) $scope.data.keyboardHeight = 0;
    //     $ionicScrollDelegate.resize();
    // };

}]);
Pta.controller('RoomsCtrl', [
  '$scope',
  'Rooms',
  '$state',
  '$ionicModal',
  'userService',
  '$firebaseObject',
  '$ionicPopup',
  '$filter',
  '$q',
  function ($scope, Rooms, $state, $ionicModal, userService, $firebaseObject, $ionicPopup, $filter, $q) {
  var userRooms = Rooms.all();

  $scope.user = userService.getUser();
  $scope.school = $firebaseObject(firebase.database().ref('schools/' + $scope.user.school));

  userRooms.$loaded()
  .then(function(userRooms){
    // Add room titles
    angular.forEach(userRooms, function(userRoom, key){
      var titleArr = [];
      angular.forEach(userRoom.chatters, function(chatter, key){
        if(chatter.id !== $scope.user.$id){
          titleArr.push(' ' + chatter.name.split(' ')[0]);
        } 
      });
      userRoom.title = titleArr.join();
    });
    // If they don't have a title the current user is the only one there
    $scope.rooms = userRooms;
  });
  
  // If The user has not selected their school redirect to the profile view
  // because we can't filter the people who they are alllowed to chat with
  if(!$scope.user.school || $scope.user.school === ""){
    var noSchoolAlert = $ionicPopup.alert({
      title: 'You haven\'t set your school',
      subTitle:"Apparent chat connects you with parents at your child's school.",
      template: "Add your child's school on your profile to start chatting!",
      okText: "Set School",
      okType: "button-balanced"
    });
    noSchoolAlert.then(function(res){
      $state.go('app.profile');
    });
  }

  $scope.$on('chatSubmitChanged', function(e, newValues){
    var submitSlideout = angular.element(document.getElementsByClassName('submit-slideout'));
    if(!newValues[0] && newValues[1].length > 0){
      submitSlideout.css({right: '0px', transition: 'all 600ms cubic-bezier(0.95, 0.05, 0.795, 0.035)'});
    } else {
      submitSlideout.css({right: '-100px', transition: 'all 600ms cubic-bezier(0.95, 0.05, 0.795, 0.035)'});
    }
  });

  $ionicModal.fromTemplateUrl('new-chat.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal= modal;
  });

  $scope.$on('$destroy', function(){
    $scope.modal.remove();
  });

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.openModal = function(){
    $scope.modal.show();
  };

  function getChatters(id){
    var deferred = $q.defer(),
        chatterIds = [],
        roomIndex = $scope.rooms.map(function(room){ 
          return room.$id;
        }).indexOf(id),
        chatters = $scope.rooms[roomIndex].chatters;
    // Get ids of everyone the user is chatting
    if(typeof chatters === "object"){
      angular.forEach(chatters, function(value, key){
        if(value.id !== $scope.user.$id){
          chatterIds.push(value.id);
        }
      });
    } else {
      for (var i = chatters.length - 1; i >= 0; i--) {
        if(chatters[i].id !== $scope.user.$id){
          chatterIds.push(chatters[i].id);
        }
      }
    }
    
    if(chatters && chatterIds.length > 0){
      deferred.resolve(chatterIds);
    } else {
      deferred.reject('No other chatters');
    }

    return deferred.promise;
  }

  $scope.openChatRoom = function (id) {
    getChatters(id)
    .then(function(chatters){
      $state.go('app.room', { 
        roomId: id,
        chatters: chatters
      });
      $scope.closeModal();
    });
  };

  $scope.createRoom = function() {
    var newRoomId = firebase.database().ref('user-rooms').child($scope.user.$id).push().key,
        id = Rooms.addNewRoom(this.$$childHead.selectedValues, '/user-rooms/', newRoomId);
    $state.go('app.room', {roomId: id});
    $scope.closeModal();
  };

}]);
Pta.controller('VolunteerCtrl', [
    '$scope',
    '$state',
    'Rooms',
    'userService',
    '$firebaseObject',
    '$firebaseArray',
    function ($scope, $state, Rooms, userService, $firebaseObject, $firebaseArray) {
    $scope.user = userService.getUser();
    $scope.thisHoursVolunteers = $state.params.thisHoursVolunteers;
    $scope.thisEvent = $state.params.thisEvent;

    var eventRoomsRef = firebase.database().ref('event-rooms');
    var chatWarp = {
            path:{ 
                radius: 14,
                angle: "0deg" 
            },
            targets:"#chatwarp",
            align: "center"
        },
        allWarp = {
            path:{ 
                radius: 28,
                angle: "180deg",
                textPosition: "inside" 
            },
            targets:"#allwarp",
            align: "center"
        };

    cssWarp(chatWarp, allWarp);

    $scope.groupChat = function(event){
        $state.go('app.room', {roomId: event.id + '-group'});
    };

    // Only used to create or open one-on-one rooms.
    // Group chat rooms are created with their corresponding event
    $scope.createRoom = function(volunteers, event, volunteer) {
        var newRoomId = $scope.user.$id + volunteer.user.$id,
            eventRooms = $firebaseArray(eventRoomsRef.child(event.id)),
            volunteersArr = [],
            id;
        if(eventRooms.$indexFor(newRoomId) >= 0){// They have a previous room around this event
            id = newRoomId;
        } else {// It's a new chat around this event
            volunteersArr.push(volunteer.user);
            id = Rooms.addNewRoom(volunteersArr, '/event-rooms/', newRoomId, event);
        }
        $state.go('app.room', {roomId: id});
    };
}]);    










Pta.controller('RoleCtrl', [
  '$scope',
  'userService',
  '$ionicPopup',
  '$firebaseArray',
  'userFilter',
  '$localstorage',
  '$ionicActionSheet',
  '$timeout',
  '$rootScope',
  function ($scope, userService, $ionicPopup, $firebaseArray, userFilter, $localstorage, $ionicActionSheet, $timeout) {
  $scope.user = userService.getUser();  
  $localstorage.remove('roleEditStart');

  var ref = firebase.database().ref(),
      rolesRef = ref.child('roles/' + $scope.user.school),
      roles = $firebaseArray(rolesRef),
      users = firebase.database().ref('users'),
      parents = $firebaseArray(users.orderByChild('school').equalTo($scope.user.school)),
      adminWarp = {
        path:{ 
            radius: 24,
            angle: "185deg",
            textPosition: "inside" 
        },
        css: "letter-spacing: 3px; font-weight: bold;",
        targets:"#adminwarp",
        align: "center",
      };
  cssWarp(adminWarp);

  roles.$loaded()
  .then(function(userRoles){
    $scope.roles = userRoles;
  });

  parents.$loaded()
  .then(function(schoolParents){
      $scope.schoolParents = schoolParents;
  });

  $scope.showOptions = false;

  $scope.addRole = function(){
    roles.$add({role_rank: "", title: "", user_name: "", user_id: ""});
  };

  $scope.startRoleSearch = function(roleIndex){
    if($scope.roles[roleIndex].user_id){
      $localstorage.setObject('roleEditStart', $scope.roles[roleIndex]);
      $scope.roleIndex = roleIndex;
    }
  };

  $scope.endRoleSearch = function(){
    var role = $scope.roles[$scope.roleIndex],
        storedRole = $localstorage.getObject('roleEditStart');
    if(!angular.equals(role, storedRole) && role){
      angular.forEach(storedRole, function(value, key){
        role[key] = value;
      });
    }
  };

  $scope.filterParents = function(e){
    $scope.filteredParents = userFilter($scope.schoolParents, e.currentTarget.value);
  };

  $scope.removeRole = function(role){
    var adminUpdate = {};
    adminUpdate['users/' + role.user_id + '/isAdmin'] = false;
    if($scope.roles.length > 1){
      if(role.title.length > 0){
        var popupTitle = role.title + " Removed",
        undoActionSheet = $ionicActionSheet.show({
          buttons: [
            {text: "<b>UNDO</b>"}
          ],
          titleText: popupTitle,
          cssClass: 'undo-actionsheet',
          buttonClicked: function(){
            var role = $localstorage.getObject('savedRole');
            delete role.$id;
            delete role.$$hashKey;
            delete role.$priority;
            rolesRef.push(role);
            adminUpdate['users/' + role.user_id + '/isAdmin'] = true;
            ref.update(adminUpdate);
            $localstorage.remove('savedRole');
            return true;
          }
        });
        ref.update(adminUpdate);
        $localstorage.setObject('savedRole', role);
        $scope.roles.$remove(role);
        $timeout(function(){
           undoActionSheet();
           $localstorage.remove('savedRole');
        }, 5000); 
      } else {
        $scope.roles.$remove(role);
      }
    } else {
      var lastAdmin = $ionicPopup.alert({
        title: "This is the last admin on your account!",
        template: "Deleting this admin will leave your school unable to update content. Please add another admin before deleting this admin."
      });
      lastAdmin; // jshint ignore:line
    }
  };

  $scope.confirmChange = function(user, role, roles){
    if($localstorage.getObject('roleEditStart')){
      $localstorage.remove('roleEditStart');
    }
    var newAdminRef = 'users/' + user.$id + '/isAdmin',
        duplicates = 0;
        updates = {};
    updates[newAdminRef] = true;
    if(role.user_id && role.user_id.length > 0){
      $localstorage.setObject('savedRole', role);
      $localstorage.setObject('savedUser', user);
      var oldAdminRef = 'users/' + role.user_id + '/isAdmin',
          undoActionSheet = $ionicActionSheet.show({// Show an action sheet to let the user undo changes
            buttons: [
              {text: "<b>UNDO</b>"}
            ],
            titleText: "Replaced " + role.user_name + " with " + user.name + " as " + role.title,
            cssClass: 'undo-actionsheet',
            buttonClicked: function(){
              duplicates = 0;
              var role = $localstorage.getObject('savedRole'),
                  user = $localstorage.getObject('savedUser');
              delete role.$id;
              delete role.$$hashKey;
              delete role.$priority;
              // Check if the user being removed holds more than one role 
              for (var i = roles.length - 1; i >= 0; i--) {
                if(roles[i].user_id === user.$id){
                  duplicates++;
                }
              }
              if(duplicates < 2) { // If the user doesn't then set their isAdmin to false
                updates[newAdminRef] = false;
              }
              updates[oldAdminRef] = true;
              ref.update(updates);
              // Undo the user swap in the roles $firebaseArray
              var keys = roles.map(function(e) { return e.$id; }),
                  indexOfKey = roles.map(function(e) { return e.user_id; }).indexOf(user.$id);
              roles.$remove(indexOfKey);
              roles.$add(role);
              $localstorage.remove('savedRole');
              $localstorage.remove('savedUser');
              return true;
            }
          });
      // Check if the user being removed holds more than one role 
      for (var i = roles.length - 1; i >= 0; i--) {
        if(roles[i].user_id === role.user_id){
          duplicates++;
        }
      }
      if(duplicates < 2) { // If the user doesn't then set their isAdmin to false
        updates[oldAdminRef] = false;
      }
      //Add the replacement user for this role
      ref.update(updates);
      rolesRef.child(role.$id).update({
        user_name: user.name,
        user_id: user.$id,
        user_pic: user.pic
      });
      $timeout(function(){// Hide the action sheet and cleanup localstorage items related to this change
         undoActionSheet();
         $localstorage.remove('savedRole');
         $localstorage.remove('savedUser');
      }, 5000); 
    } else {// This is someone adding a new role, not a change
      ref.update(updates);
      rolesRef.child(role.$id).update({
        user_name: user.name,
        user_id: user.$id,
        user_pic: user.pic
      });
    }
  };
  
}]);
Pta.controller('BoardCtrl', [
  '$scope',
  '$firebaseArray',
  'userService',
  function ($scope, $firebaseArray, userService) {
    var user = userService.getUser(),
        boardmembers = firebase.database().ref('roles').child(user.school);
    $firebaseArray(boardmembers)
    .$loaded()
    .then(function(boardmembers){
      $scope.boardmembers = boardmembers;
    });
}]);
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
        $scope.openLogoModal();
      }, function(error) {
       console.log(error);
      });
    };

    $ionicModal.fromTemplateUrl('crop-logo.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.logoModal = modal;
    });

    $scope.$on('$destroy', function() {
      $scope.logoModal.remove();
    });

    $scope.openLogoModal = function(name){
      $scope.logoModal.show();
    };

    $scope.closeLogoModal = function(name) {
      $scope.logoModal.hide();
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
        array[i] = binary.charCodeAt(i); 
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
                $scope.closeLogoModal();
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
              $scope.closeLogoModal();
            });
          }
        });
      });
    };
}]);



Pta.controller('ParentCtrl', [
  '$scope',
  'userService',
  '$state',
  'userFilter',
  '$firebaseArray',
  '$cordovaEmailComposer',
  'Rooms',
  function($scope, userService, $state, userFilter, $firebaseArray, $cordovaEmailComposer, Rooms) {
    var user = userService.getUser(),
        users = firebase.database().ref('users'),
        userRoomsRef = firebase.database().ref('user-rooms').child(user.$id),
        userRooms = $firebaseArray(userRoomsRef);
        school = $firebaseArray(users.orderByChild('school').equalTo(user.school));
    school.$loaded()
    .then(function(schoolParents){
        $scope.schoolParents = schoolParents;
        $scope.filterParents();
    });

    $scope.filterParents = function(){
      $scope.parents = userFilter($scope.schoolParents, $scope.search);
    };

    $scope.childWidth = function(children){
      if(children.length > 1){
        return "40%";
      } else {
        return "90%";
      }
    };

    $scope.childMarginTop = function(children){
      if(children.length <= 2){
        return "27px";
      } else {
        return "0";
      }
    };

    $scope.call = function(number){
      if(number){
        window.plugins.CallNumber.callNumber(
          function(res){
            console.log(res);
          },
          function(err){
            console.log(err);
          }, number);
      }
    };

    $scope.email = function(address){
      $cordovaEmailComposer.open({to: address})
      .then(null,
        function(){
          console.log("cancelled");
      });
    };

    $scope.openChatRoom = function (chatter) {
      var roomId = user.$id + chatter.$id,
          chattersArr = [],
          id;
      if(userRooms.$indexFor(roomId) >= 0){
        id = roomId;
      } else {
        chattersArr.push(chatter);
        id = Rooms.addNewRoom(chattersArr, '/user-rooms/', roomId);
      }
      $state.go('app.room', { roomId: id });
    };
}]);


