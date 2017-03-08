Pta.controller('CalendarCtrl', [
  '$scope',  
  '$timeout', 
  '$state',
  '$ionicPopup',
  '$ionicSideMenuDelegate',
  '$firebaseArray',
  '$stateParams',
  '$compile',
  '$localstorage',
  '$ionicPlatform',
  'userService',
  'time',
  function ($scope, $timeout, $state, $ionicPopup, $ionicSideMenuDelegate, $firebaseArray, $stateParams, $compile, $localstorage, $ionicPlatform, userService, time) {
  'use strict';

  $scope.selectedEvent = $stateParams.selectedEvent;
  $ionicSideMenuDelegate.canDragContent(false)

  if($stateParams.selectedEvent && $stateParams.selectedEvent.cleanup_start){
    $scope.currentDate = new Date($stateParams.selectedEvent.cleanup_start);
  } else if($stateParams.selectedEvent && $stateParams.selectedEvent.event_start) {
    $scope.currentDate = new Date($stateParams.selectedEvent.event_start);
  } else {
    $scope.currentDate = new Date();
  }

  var user = userService.getUser(),
      ref = firebase.database().ref(),
      eventsRef = ref.child('events');
  $scope.calEvents = $firebaseArray(eventsRef);

  $scope.calendarTitle = $stateParams.calendarTitle;
  $scope.isVolunteerSignup = $stateParams.isVolunteerSignup;

  $scope.itemSelected = {};
  $scope.eventTypes = [
    {type: 'all', label: 'All'},
    {type: 'setup', label: 'Setup'},
    {type: 'event', label: 'Event'},
    {type: 'cleanup', label: 'Cleanup'}
  ];

  $scope.$on('displayTimes', function(e, displayStart, displayEnd){
    $scope.displayStart = displayStart;
    $scope.displayEnd = displayEnd;
  });

  $scope.reloadEvents = function(){
    $scope.$broadcast('eventFilter', $scope.itemSelected.type);
  }

  // Google Drive integration back-burnered 10-7-2016
  // $scope.files = [];
  // $scope.readFiles = function (school) {
  //     Drive.showPicker(school.document_storage_token);
  // };
  // $scope.goToSettings = function(){
  //   $state.go('app.admin.settings');
  //   $scope.closeModal();
  // }
       
  $scope.isDragging = true;

  $scope.mode = 'day';

  $scope.changeMode = function (mode) {
    $scope.mode = mode;
  };

  $scope.inputHidden = function(){
    if($scope.selectedTime.id === 0){
      return "hidden-input";
    }
  }

  $scope.today = function () {
      $scope.currentDate = new Date();
  };

  $scope.timeValue = null;
  $scope.items = [
    {
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
    }
  ];
  $scope.selectedTime = $scope.items[0];

  var timeInputWatch = $scope.$watch('timeValue', function(newValue, oldValue) {
      if(newValue && newValue != 0){// The user has set a time value
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
  }

  $scope.createCalEvent = function(){
    var startDate = time.parseTime($scope.displayStart, new Date($scope.selectedEvent.date)).toString(),
        endDate = time.parseTime($scope.displayEnd, new Date($scope.selectedEvent.date)).toString(),
        eventRef = eventsRef.child($scope.selectedEvent.$id),
        currentVolunteers = $firebaseArray(eventRef.child('volunteers')),
        volunteer = { id: user.user_id, start: startDate, end: endDate };
    currentVolunteers.$loaded()
    .then(function(volunteers){
      //Make sure a previous volunteer isn't adding more time
      if(volunteers.length > 0){
        for (var i = volunteers.length - 1; i >= 0; i--) {
          if(volunteers[i].id === user.user_id){//Only add them to the volunteers
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
  }

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
              var volunteerHours = moment(time.parseTime($scope.displayEnd)).diff(time.parseTime($scope.displayStart), 'hours'),
                  selectedEventRef = firebase.database().ref('events').child($scope.selectedEvent.$id),
                  count = 0,
                  coveredHours;
              // Deduct the hours just volunteered from the total volunteer hours needed.
              $scope.selectedEvent.volunteer_hours = $scope.selectedEvent.volunteer_hours - volunteerHours;
              if($scope.selectedEvent.covered_hours){
                coveredHours = $scope.selectedEvent.covered_hours + volunteerHours;
              } else {
                coveredHours = volunteerHours
              }
              selectedEventRef.update({covered_hours: coveredHours});

              $scope.createReminders = $ionicPopup.show({
                  title: 'Add a reminder?',
                  templateUrl: 'templates/set-notification.html',
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
                              count++
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
  }

  $scope.$on('timeSelected', function(eventTimes){
    $state.go('app.admin.addevent', {newEvent: eventTimes.targetScope.event});
  });

  // $scope.eventSelected = function(calEvent){
  //     if($scope.isCalView){// If this isn't the volunteer signup view;
  //         $scope.event.start_date = calEvent.event.start_time;
  //         $scope.event.end_date = calEvent.event.end_time;
  //         $scope.event.start_time = calEvent.event.start_time;
  //         $scope.event.end_time = calEvent.event.end_time;
  //         $scope.event.event_title = calEvent.event.title;
  //         $scope.location = {};
  //         $scope.location.formatted_address = calEvent.event.location;
  //         $scope.modal.show();
  //     }
  // }

  $ionicPlatform.onHardwareBackButton(function(){
    if($scope.event){
      $scope.event.setup_volunteers_needed = null;
      $scope.event.volunteers_needed = null;
      $scope.event.cleanup_volunteers_needed = null;
    }
  });

}]);