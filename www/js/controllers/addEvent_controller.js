Pta.controller('AddEventCtrl', [
  '$scope',
  '$state',
  'modalService',
  'imgStorage',
  '$stateParams',
  'time',
  '$ionicLoading',
  '$timeout',
  '$localstorage',
  'Rooms',
  'userService',
  '$firebaseArray',
  '$firebaseObject',
  '$cordovaImagePicker',
  function($scope, $state, modalService, imgStorage, $stateParams, time, $ionicLoading, $timeout, $localstorage, Rooms, userService, $firebaseArray, $firebaseObject, $cordovaImagePicker){
    
    var user = userService.getUser(),
        ref = firebase.database().ref(),
        eventsRef = ref.child('events');

    $scope.event = $stateParams.newEvent;

    $scope.$on('displayTimes', function(e, displayStart, displayEnd){
      $scope.displayStart = displayStart;
      $scope.displayEnd = displayEnd;
    });

    $scope.$on('selectedLocation', function(e){
        $scope.event.location = e.targetScope.location.formatted_address;
    });

    //image pick & crop
    $scope.getImage = function(){
      $cordovaImagePicker.getPictures({
      maximumImagesCount: 1
      })
      .then(function (results) {
        $scope.picFile = results[0];
        modalService
        .init('templates/rectangular-crop.html', $scope)
        .then(function(modal){
          modal.show();
        });
      }, function(error) {
       console.log(error)
      });
    }
  
    $scope.storeImage = function(file){
      $scope.event.cover_photo_url = $scope.picFile.substring($scope.picFile.lastIndexOf('/') + 1, $scope.picFile.length);
      $localstorage.setObject('eventImg', {
        file: file,
        storageDir: 'event_pics'
      });
      $scope.modal.hide();        
    }

    $scope.hasSetup = function(){
        if($scope.event.setup_volunteers_needed && $scope.event.setup_volunteers_needed != 0){
            $scope.event.setup_start_time = moment($scope.event.start_time).subtract(2, 'hours')._d;
            $scope.event.setup_end_time = $scope.event.start_time;
            $scope.event.setup_start_date = $scope.event.start_date;
            $scope.event.setup_end_date = $scope.event.start_date;
        }
    }

    $scope.hasCleanup = function(){
        if($scope.event.cleanup_volunteers_needed && $scope.event.setup_volunteers_needed != 0){
            $scope.event.cleanup_end_time = moment($scope.event.end_time).add(2, 'hours')._d;
            $scope.event.cleanup_start_time = $scope.event.end_time;
            $scope.event.cleanup_start_date = $scope.event.start_date;
            $scope.event.cleanup_end_date = $scope.event.start_date;
        }
    }

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
          }
          if(eventRoom.title){
            newEventRoom.title = eventRoom.title;
          }
          updates['/user-rooms/' + user.$id + '/' + roomId] = newEventRoom;

          ref.update(updates);
        });
      });
    }

    //save confirmation post submit
    $scope.saving = function(data, cb) {
      $ionicLoading.show({
        template: 'Saving ' + data + '.',
        hideOnStateChange: true
      });
      cb();
    }

    $scope.showLoading = function(){
      $ionicLoading.show({
        template: "<ion-spinner icon='android'></ion-spinner>"
      });
    }

    $scope.hideLoading = function(){
      $timeout(function(){
        $ionicLoading.hide();
      }, 500);
    }

    $scope.saveEvent = function(e, event){
      e.preventDefault();
      e.stopPropagation();

      $scope.submitted = true;
      if($scope.newEventForm.title.$valid){
        $scope.saving(event.title, function(){
          var eventImgObj = $localstorage.getObject('eventImg');

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

          // Image save callback
          var callback = function(imgUrl){
            var updates = {};
            updates['events/' + event.id + '/cover_photo_url'] = imgUrl;

            $localstorage.remove('eventImg');

            if(event.volunteer_hours){
              // Create a group chat room under the event-rooms/<eventId> w/ the admin who created the event in the room
              Rooms.addNewRoom([], '/event-rooms/', event.id + '-group', event);
              firebase.database().ref().update(updates)
              .then(function(){
                $state.go('app.events');
              });
            } else {
              firebase.database().ref().update(updates)
              .then(function(){
                $state.go('app.events');
              });
            } 
          }

          event.id = eventsRef.push($scope.event).key;
          if(eventImgObj.file){
            imgStorage.storeImage(eventImgObj.file, eventImgObj.storageDir, event.id, null, callback);
          } else if(event.volunteer_hours) {
            $state.go('app.events', function(){
              Rooms.addNewRoom([], '/event-rooms/', event.id + '-group', event);
            });
          } else {
            $state.go('app.events');
          }
          
        });
      }         
    }
}]);