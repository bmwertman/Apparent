Pta.controller('CalendarCtrl', [
  '$scope', 
  '$ionicLoading', 
  '$location', 
  '$timeout', 
  '$state',
  '$ionicModal',
  '$ionicPopup',
  '$ionicSideMenuDelegate',
  'FIREBASE_URL',
  '$firebaseArray',
  // '$cordovaSocialSharing',
  // 'eventService',// formerly repair service 
  // 'jwtHelper',
  // 'Idle',
  // 'signinService',
  // '$ionicPlatform',
  // '$cordovaPrinter',
  function ($scope, $ionicLoading, $location, $timeout, $state, $ionicModal, $ionicPopup, $ionicSideMenuDelegate, FIREBASE_URL, $firebaseArray) {
  'use strict';

  $ionicSideMenuDelegate.canDragContent(false)

  // Get the event data from firebase as an array
  var ref = new Firebase(FIREBASE_URL);
  var eventsRef = ref.child('events');
  $scope.events = $firebaseArray(eventsRef);

  $scope.events.$loaded(function(data){
    // This is where you have access to the data after it has loaded!!!
  });

  // $scope.$on('signedin', function(){
  //   Idle.watch();
  // });

  // if(!Idle.running()){
  //   Idle.watch();
  // }
  
  // $scope.$on('IdleStart', function(){
  //   signinService
  //   .init('signin/templates/signin.html', $scope)
  //   .then(function(modal) {
  //     modal.show();
  //     Idle.unwatch();
  //   });
  // });

  //error message display
  $scope.err = function(err, lineNumber) {
    $ionicLoading.show({
      template: 'The save failed with error ' + err + '.Line ' + lineNumber + ', CalendarCtrl',
      duration: 2300
    });
  }

  $scope.deleted = function(){
    $ionicLoading.show({
      template: 'Job Succesfully Deleted',
      duration: 2300
    });
  }

  $scope.isDragging = true;

  $ionicModal.fromTemplateUrl('templates/edit_event.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });


  // $scope.printAppointment = function (){
  //   $scope.jobId = $scope.editAppointmentDetails.repairDetails.id.toString();//encoded as a QR code on the printed work request
  //   var wr = document.getElementById('wr');
  //   $cordovaPrinter.isAvailable()
  //   .then( function (isAvailable) {
  //     if(isAvailable){
  //       $cordovaPrinter.print(wr, 'edit_schedule.html', function () {
  //         $ionicPopup.alert({
  //           template:  "<h3>Success</h3><br><strong><p>Your work request is queued for printing</p></strong>"
  //         });
  //       });
  //     } else {
  //       $ionicPopup.alert({
  //         template:  "<h3>Sorry</h3><br><strong><p>Print options are not available for your device</p></strong>"
  //       });
  //     }
  //   });
  // }

  // $scope.emailAppointment = function () {
  //   $scope.jobId = $scope.eventSource2[0].repairDetails.id.toString();//encoded as a QR code on the printed work request
  //   var wr = angular.element(document.getElementById('wr')).html();
  //   var techEmail = [];
  //    for (var i = $scope.technicianNames.length - 1; i >= 0; i--) {
  //       if($scope.technicianNames[i].id === $scope.editAppointmentDetails.repairDetails.technician_id){
  //         techEmail.push($scope.technicianNames[i].email);
  //       }
  //     };
  //   $timeout( function(){
  //     var imgSrc = []
  //     imgSrc.push(document.getElementById('qr-code').src);
  //     $cordovaSocialSharing.shareViaEmail(wr, 'Next scheduled job', techEmail, null, null , imgSrc);
  //   },75);
  // }

  $scope.openModal = function() {
    $scope.modal.show();
  };

  $scope.$on('$destroy', function(){
    $scope.modal.remove();
  });

  // $scope.editAppointment = function() {
  //   var repair = $scope.editAppointmentDetails;
  //   for (var i = $scope.employees.length - 1; i >= 0; i--) {//in editRepair()
  //     if($scope.employees[i].tech_id && $scope.employees[i].tech_id === repair.repairDetails.technician_id){
  //       repair.currentTech = $scope.employees[i];
  //     }
  //   };
  //   repairService.setRepair(repair);
  //   $scope.modal.hide();
  //   $location.path('/manage');
  // }

  // $scope.deleteAppointment = function() {
  //   $sailsSocket.delete('/schedules/' + $scope.editAppointmentDetails.schedule_id)
  //   .then(function(response){
  //     $sailsSocket.delete('/repairhistory/' + response.data.repair_history_id.id)
  //     .then(function (){
  //       $scope.deleted();
  //       $scope.modal.hide();
  //       $state.go($state.current, {}, {reload: true});
  //     })
  //     .catch(function (err){
  //       $scope.err(err.status, 134);
  //     });
  //   })
  //   .catch(function (err){
  //     $scope.err(err.status, 141);
  //   });
  // }

  $scope.currentDate = new Date();
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

  $scope.onEventSelected = function (event) {
    $scope.pastJob = false;
    $scope.editAppointmentDetails = event;
    //Job can be edited up to twenty minute buffer after scheduled start
    var startLessTwenty = Date.parse(event.startTime) - 1200000;
    if(Date.parse(new Date()) >= startLessTwenty){
      $scope.pastJob = true;//hides edit and delete buttons
    }
    $scope.openModal();
  };

  $scope.reloadSource = function (startTime, endTime) {
    $scope.lowerBound = startTime;
    $scope.upperBound = endTime;
    // getNewSchedule();
  };

  // $scope.getSchedule = function() {
  //   var startTimeToday = new Date();
  //   startTimeToday.setHours(0);
  //   startTimeToday.setMinutes(0);
  //   var endTimeToday = new Date();
  //   endTimeToday.setHours(23);
  //   endTimeToday.setMinutes(59);
  //   $scope.lowerBound = startTimeToday;
  //   $scope.upperBound = endTimeToday;
  //   $scope.getShopHours();
  //   getNewSchedule();
  // };

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
      return dt; //Create an array of hours that represents the repair shop's operating hours
  }

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

  // $scope.splitJobs = function (appointments, businessHours){
  //   for (var i = appointments.length - 1; i >= 0; i--) {
  //     var end_time = moment.utc(appointments[i].endTime);
  //     var start_time = moment.utc(appointments[i].startTime);
  //     for (var x = businessHours.length - 1; x >= 0; x--) {
  //       var close = moment.utc(businessHours[x].close_time);
  //       if(end_time.isAfter(close) && start_time.day() === close.day()){//This is a job that gets split
  //         var jobStart  = moment.utc(appointments[i].startTime);

  //         var ms = moment.utc(jobStart,"DD/MM/YYYY HH:mm:ss").diff(moment.utc(close,"DD/MM/YYYY HH:mm:ss"));
  //         var d = moment.duration(ms);
  //         var s = Math.floor(d.asHours());
  //         var timeIntoTomorrow = Math.round((parseFloat(appointments[i].repairDetails.allotted_time) + s) * 10)/10;
  //         var apptSplit = {}
  //         for(var prop in appointments[i]){
  //           apptSplit[prop]=appointments[i][prop];
  //         }
  //         appointments[i].endTime = close.toISOString();
  //         appointments[i].totalApptTime = (Math.round((parseFloat(appointments[i].repairDetails.allotted_time)) * 10)/10) - timeIntoTomorrow;
  //         for (var v = businessHours.length - 1; v >= 0; v--) {
  //           //If this is the day after the day the split job started on
  //           if(moment.utc(businessHours[v].open_time).day() === moment.utc(businessHours[x].open_time).day() + 1){
  //             apptSplit.startTime = moment.utc(businessHours[v].open_time).toISOString();
  //             apptSplit.endTime = moment.utc(Date.parse(apptSplit.startTime)+(timeIntoTomorrow * 3600000)).toISOString();
  //             apptSplit.totalApptTime = timeIntoTomorrow;
  //           }
  //         };
  //         appointments.push(apptSplit);
  //       }
  //     };
  //   };
  // }

  // function getNewSchedule() {
  //   if ($scope.technicianID && $scope.technicianID.fullName !== 'All') {
  //     var getTechnicianID = $scope.technicianID.id;
  //   } else {
  //     var getTechnicianID = {'!': undefined };
  //   }

  //   $sailsSocket.get("/schedules", {params: 
  //     {where: {
  //       repair_shop_id: $localstorage.get('shopId'),
  //       technician_id: getTechnicianID,
  //       scheduled_start_time:{ date: {'>':$scope.lowerBound, '<':$scope.upperBound}}
  //       }
  //     }
  //   })
  //   .then(function (response){
  //     var jobs = response.data;
  //     var appointments = [];
  //     for (var i = 0; i < jobs.length; i++) {
  //       var convertStartDate = formatAMPM(new Date(jobs[i].scheduled_start_time));
  //       var convertEndDate = formatAMPM(new Date(jobs[i].scheduled_end_time));
  //       var startTimeOffsetPercent = getTimeOffset(new Date(jobs[i].scheduled_start_time));
  //       var totalApptTime = getApptTime(new Date(jobs[i].scheduled_start_time), new Date(jobs[i].scheduled_end_time));
  //       if($scope.technicianNames){
  //         for (var x = $scope.technicianNames.length - 1; x >= 0; x--) {
  //           if($scope.technicianNames[x].id === jobs[i].technician_id.id){
  //             var techName = $scope.technicianNames[x].fullName;
  //           }
  //         };
  //         appointments[i] = {allDay: false,
  //                           schedule_id: jobs[i].id, 
  //                           startTime: jobs[i].scheduled_start_time,
  //                           startTimeOffset: startTimeOffsetPercent,
  //                           startTimeDisplay: convertStartDate,
  //                           endTime: jobs[i].scheduled_end_time,
  //                           endTimeDisplay: convertEndDate,
  //                           totalApptTime: totalApptTime,
  //                           repairDetails: jobs[i].repair_history_id,
  //                           repairShopEquipmentID: jobs[i].repair_shop_equipment_id,
  //                           fullName: techName, 
  //                           title: techName + '\n' +
  //                           jobs[i].repair_shop_equipment_id.repair_shop_equipment_name + '\n' +
  //                           jobs[i].repair_history_id.repair_description + '\n' +
  //                           convertStartDate + ' - ' + convertEndDate
  //                           };
  //       }
  //       $scope.splitJobs(appointments, $scope.businessHours);
  //     };
  //     $scope.eventSource2 = appointments;
  //   })
  //   .catch( function (err){
  //     $scope.err(err.status, 258);
  //   });
  // };
}]);