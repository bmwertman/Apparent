Pta.controller('CalendarCtrl', [
  '$scope', 
  '$ionicLoading', 
  '$timeout', 
  '$state',
  '$ionicModal',
  '$ionicPopup',
  '$ionicSideMenuDelegate',
  '$firebaseArray',
  '$rootScope',
  '$stateParams',
  '$compile',
  '$localstorage',
  '$ionicPlatform',
  '$ionicHistory',
  'Rooms',
  function ($scope, $ionicLoading, $timeout, $state, $ionicModal, $ionicPopup, $ionicSideMenuDelegate, $firebaseArray, $rootScope, $stateParams, $compile, $localstorage, $ionicPlatform, $ionicHistory, Rooms) {
  'use strict';

  $scope.volunteerChat = function(){
    debugger;
  }

  $scope.selectedEvent = $stateParams.selectedEvent;
  $ionicSideMenuDelegate.canDragContent(false)

  if($stateParams.selectedEvent && $stateParams.selectedEvent.cleanup_start){
    $scope.currentDate = new Date($stateParams.selectedEvent.cleanup_start);
  } else if($stateParams.selectedEvent && $stateParams.selectedEvent.event_start) {
    $scope.currentDate = new Date($stateParams.selectedEvent.event_start);
  } else {
    $scope.currentDate = new Date();
  }

  $scope.isAdmin = false;
  $scope.calendarTitle = "Volunteer - " + moment($scope.currentDate).format('dddd, MMMM Do');
  $scope.isVolunteerSignup = true;

  if($rootScope.profile.isAdmin && $ionicHistory.backView().stateName === "app.events"){
    $scope.isAdmin = true;
  } else if($rootScope.profile.isAdmin) {
    $scope.isAdmin = true;
    $scope.calendarTitle = "Calendar";
    $scope.isVolunteerSignup = false;
  } 

  $scope.itemSelected = {};
  $scope.eventTypes = [
    {type: 'all', label: 'All'},
    {type: 'setup', label: 'Setup'},
    {type: 'event', label: 'Event'},
    {type: 'cleanup', label: 'Cleanup'}
  ];

  $scope.reloadEvents = function(){
    $scope.$broadcast('eventFilter', $scope.itemSelected.type);
  }

  // Get the event data from firebase as an array
  var ref = firebase.database().ref();
  var eventsRef = ref.child('events');
  $scope.calEvents = $firebaseArray(eventsRef);

  $scope.calEvents.$loaded(function(data){
    // This is where you have access to the data after it has loaded!!!
  });

  // $ionicModal.fromTemplateUrl('templates/edit_event.html', {
  //   scope: $scope,
  //   animation: 'slide-in-up'
  // }).then(function(modal) {
  //   $scope.modal = modal;
  // });

  $ionicModal.fromTemplateUrl('templates/add_event.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.addEventModal = function() {
      $scope.modal.show();
  };

  $scope.$on('$destroy', function(){
      $scope.modal.remove();
  });

  $scope.closeModal = function() {
      $scope.modal.hide();
      $scope.event = {};
  };

  //save confirmation post submit
  $scope.saved = function(data, cb) {
    $ionicLoading.show({
      template: data + ' has been saved.',
      duration: 2300
    });
  }

  //error message display
  $scope.err = function(err, lineNumber) {
    $ionicLoading.show({
      template: 'The save failed with error ' + err.status + '.Line ' + lineNumber + ', CheckinCtrl.',
      duration: 4000
    });
  }
  
  $scope.deleted = function(){
    $ionicLoading.show({
      template: 'Job Succesfully Deleted',
      duration: 2300
    });
  }

  $scope.isDragging = true;

  $scope.$on('$destroy', function(){
    $scope.modal.remove();
  });

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
  };

  function getTimeOffset(date) {
    var minutes = date.getMinutes();
    var percentOfHour = (minutes / 60) * 100; 
    return percentOfHour;
  };

  function getApptTime(startTime, endTime) {
    var totalDifference = endTime - startTime;
    var convertToMins = totalDifference / 1000 / 60 / 60;
    return convertToMins
  };

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
  }

  $scope.$on('displayTimes', function(e, displayStart, displayEnd){
    $scope.displayStart = displayStart;
    $scope.displayEnd = displayEnd;
  });

  $scope.inputHidden = function(){
    if($scope.selectedTime.id === 0){
      return "hidden-input";
    }
  }

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
    var calOptions = window.plugins.calendar.getCalendarOptions(); 
    calOptions.firstReminderMinutes = $localstorage.get('firstReminderMinutes');
    calOptions.secondReminderMinutes = $localstorage.get('secondReminderMinutes');
    var title = $scope.selectedEvent.event_title,
        eventLocation = $scope.selectedEvent.location,
        notes = null,
        startDate = $scope.parseTime($scope.displayStart, new Date($scope.selectedEvent.date)),
        endDate = $scope.parseTime($scope.displayEnd, new Date($scope.selectedEvent.date));
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
    $localstorage.set('firstReminderMinutes', null);
    $localstorage.set('secondReminderMinutes', null);
    var ref = firebase.database().ref();
    var eventRef = ref.child('events').child($scope.selectedEvent.$id);
    var volunteersRef = eventRef.child('volunteers');
    var uid = JSON.parse($localstorage.get('firebase:session::sizzling-fire-7440')).uid;//get the user's id
    var volunteer = { 
      id: uid,
      start: moment(startDate)._d, 
      end: moment(endDate)._d
    }
    var volunteerPushId = volunteersRef.push(volunteer).key();
    var volunteerRef = volunteersRef.child(volunteerPushId);
    volunteerRef.update(volunteer);

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
              var count = 0;
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
                                var calOptions = window.plugins.calendar.getCalendarOptions(); 
                                calOptions.firstReminderMinutes = null;
                                calOptions.secondReminderMinutes = null;
                                $scope.createCalEvent(calOptions);// Add the event w/o notifications
                              }
                          }
                      },{
                          text: 'Add Reminder(s)',
                          type: 'button-balanced',
                          onTap: function(e){
                            if(count === 0){
                              count++
                              $scope.createCalEvent();// Add the event w/ notifications
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
  })

  $scope.eventSelected = function(calEvent){
      if($scope.isCalView){// If this isn't the volunteer signup view;
          $scope.event.start_date = calEvent.event.start_time;
          $scope.event.end_date = calEvent.event.end_time;
          $scope.event.start_time = calEvent.event.start_time;
          $scope.event.end_time = calEvent.event.end_time;
          $scope.event.event_title = calEvent.event.title;
          $scope.location = {};
          $scope.location.formatted_address = calEvent.event.location;
          $scope.modal.show();
      }
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

  $ionicPlatform.onHardwareBackButton(function(){
      $scope.event.setup_volunteers_needed = null;
      $scope.event.volunteers_needed = null;
      $scope.event.cleanup_volunteers_needed = null;
  });

  $scope.$on('selectedLocation', function(e){
      $scope.event.location = e.targetScope.location.formatted_address;
  });

  $scope.saveEvent = function(event){
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
      var ref = firebase.database().ref();
      var eventsRef = ref.child('events');
      eventsRef.push($scope.event);
      $scope.saved(event.event_title, $scope.closeModal());
      if($rootScope.profile.isAdmin){
          $state.go('app.calendar');
      } else {
          $state.go('app.volunteer');
      }   
  }

}]);