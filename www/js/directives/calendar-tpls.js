Pta.constant('calendar2Config', {
        formatDay: 'dd',
        formatDayHeader: 'EEE',
        formatDayTitle: 'EEE MMM dd, yyyy',
        formatWeekTitle: 'MMMM yyyy, Week w',
        formatMonthTitle: 'MMMM yyyy',
        calendarMode: 'day',
        showWeeks: false,
        showEventDetail: true,
        startingDay: 0,
        filteredEvents: null,
        queryMode: 'local'
    })
    .controller('CalendarController', [
        '$scope', 
        '$attrs', 
        '$parse', 
        '$interpolate', 
        '$log', 
        'dateFilter', 
        'calendar2Config', 
        '$timeout',
        '$firebaseArray',
        '$ionicHistory',
        'dragulaService',
        '$compile',
        '$filter',
        '$q',
        '$firebaseObject',
        'userService',
        '$state',
        '$ionicActionSheet',
        function ($scope, $attrs, $parse, $interpolate, $log, dateFilter, calendar2Config, $timeout, $firebaseArray, $ionicHistory, dragulaService, $compile, $filter, $q, $firebaseObject, userService, $state, $ionicActionSheet) {
        'use strict';

        $scope.user = userService.getUser();

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

        // Get the event data from firebase as an array
        var ref = firebase.database().ref();
        var eventsRef = ref.child('events').orderByChild('date');
        var usersRef = $firebaseArray(ref.child('users'));
        $scope.calEvents = $firebaseArray(eventsRef);
        
        $scope.calEvents.$loaded(function(data){
            if($ionicHistory.backView.stateName = "app.events"){// filtering out events that don't need volunteers for volunteer signup view
                for (var i = data.length - 1; i >= 0; i--) {
                    if(!data[i].volunteer_hours){
                        data.splice(i, 1);
                    }
                }
            }
            if($scope.$parent.$parent.selectedEvent && $scope.$parent.$parent.selectedEvent.date){// If only interested in a particular event
                data = $scope.filterEventsByDate(data, new Date($scope.$parent.$parent.selectedEvent.date), 'event_start');
                $scope.selectedEvent = data[0];  
            }
            $scope.eventSource = [];
        
            //Break the event into setup, main event and cleanup segments
            function segmentEvent(){
                for (var i = data.length - 1; i >= 0; i--) {
                    $scope.eventId = data[i].$id;
                    angular.forEach(data[i], function(value, key){
                        var startType, endType, eventType, eventColor, title, volunteerType;
                        if(key === 'setup_start'){
                            startType = 'setup_start';
                            endType = 'setup_end';
                            eventType = 'setup';
                            eventColor = 'primaryGreen';
                            title = " Setup";
                            volunteerType = 'setup_volunteers_needed';
                        } else if(key === 'event_start'){
                            startType = 'event_start';
                            eventColor = 'primaryBlue';
                            endType = 'event_end';
                            eventType = 'event';
                            title = '';
                            volunteerType = 'volunteers_needed';
                        } else if(key === 'cleanup_start')  {
                            startType = 'cleanup_start';
                            endType = 'cleanup_end';
                            eventColor = 'primaryRed';
                            eventType = 'cleanup';
                            title = ' Cleanup'
                            volunteerType = 'cleanup_volunteers_needed';
                        }
                        if(startType){
                            var segmentObj = {
                                id: this.$id,
                                allday: false,
                                location: this.location,
                                startTime: this[startType],
                                endTime:this[endType],
                                type: eventType,
                                volunteersNeeded: this[volunteerType],
                                color: eventColor,
                                title: this.title + title,
                                startTimeOffset: getTimeOffset(new Date(this[startType])),
                                totalApptTime: getApptTime(new Date(this[startType]), new Date(this[endType]))
                            }
                            if(this.volunteers){// This event has volunteers
                                segmentObj.volunteersCount = Object.keys(this.volunteers).length
                                // segmentObj.volunteerTitle = segmentObj.volunteersCount + ' of ' + this[volunteerType]; 
                            }
                            $scope.eventSource.push(segmentObj);
                        }
                    }, data[i]);
                }
                $scope.arrayify(data[0], $scope.eventSource[$scope.eventSource.length - 1]);
            }
            segmentEvent();
            $scope.filteredEvents = $scope.eventSource;
        });

        var iterations = 0;
        $scope.arrayify = function(event, newObj){
            var volunteerDuration,
                volunteerStart,
                volunteerEnd,
                hoursToAdd,
                volunteerArr = [],
                segmentStart,
                segmentEnd;
            if(newObj){
                segmentStart = moment(event[newObj.type + '_' + 'start']);
                segmentEnd = moment(event[newObj.type + '_' + 'end']);
            }
            // Iterate over volunteers and match the hours they volunteered
            // to the correct event segment
            if(event && event.volunteers){
                angular.forEach(event.volunteers, function(value, key){
                    var volunteer = {};
                    volunteer.hours = [];
                    volunteerStart = moment(value.start);
                    volunteerEnd = moment(value.end);
                    // Determine if volunteer's start or end time falls within this event segment
                    // and get the duration
                    if(volunteerStart.isSame(segmentStart) || volunteerStart.isBefore(segmentStart)){
                        if(volunteerEnd.isSame(segmentEnd) || volunteerEnd.isAfter(segmentEnd)){
                            volunteerDuration = segmentEnd.diff(segmentStart, 'hours');
                        } else if(volunteerEnd.isBetween(segmentStart, segmentEnd)){
                            volunteerDuration = volunteerEnd.diff(segmentStart, 'hours');
                        } else {
                            volunteerDuration = 0;
                        }
                    } else if(volunteerStart.isBetween(segmentStart, segmentEnd)){
                        if(volunteerEnd.isSame(segmentEnd) || volunteerEnd.isAfter(segmentEnd)){
                            volunteerDuration = segmentEnd.diff(segmentStart, 'hours');
                        } else if(volunteerEnd.isBetween(volunteerStart, segmentEnd)){
                            volunteerDuration = volunteerEnd.diff(volunteerStart, 'hours');
                        } else {
                            volunteerDuration = 0;
                        }
                    } else {
                        volunteerDuration = 0;
                    }
                    // Create an array of date-times for each hour volunteered 
                    // in this event segment
                    if(volunteerDuration > 0){
                        if($scope.eventSource.length > 0 && event.$id === $scope.eventId && newObj.type !== 'setup'){ // Is either event or cleanup segment of the same event
                            var previousSegment = $scope.eventSource[$scope.eventSource.length - 1],//the previous segment added
                                setupSegment = $filter('filter')($scope.eventSource, {id: newObj.id, type: 'setup'});
                                volunteer.type = 'setup';
                            if(newObj.type === 'event'){
                                hoursToAdd = moment(previousSegment.endTime).diff(previousSegment.startTime, 'hours');
                                volunteer.type = 'event';
                            } else if(newObj.type === 'cleanup') {
                                var eventSegment = $filter('filter')($scope.eventSource, {id: newObj.id, type: 'event'});
                                if(moment(value.start).isBetween(eventSegment[0].startTime, eventSegment[0].endTime) || moment(value.start).isSame(eventSegment[0].startTime) ){
                                    hoursToAdd = moment(eventSegment[0].endTime).diff(value.start, 'hours');
                                } else if(moment(value.start).isBetween(setupSegment[0].startTime, setupSegment[0].endTime) || moment(value.start).isSame(setupSegment[0].startTime)){
                                    hoursToAdd = moment(setupSegment[0].endTime).diff(value.start, 'hours') + moment(eventSegment[0].endTime).diff(eventSegment[0].startTime, 'hours');
                                }
                                volunteer.type = 'cleanup';
                                for (var i = 0; i < volunteerDuration; i++) {
                                    volunteer.hours.push(moment(volunteerStart._d).add((i + hoursToAdd), 'hours')); 
                                }
                            } else {
                                console.log("Error calculating volunteer hours");
                            }
                        } else {
                            hoursToAdd = 0;
                        }

                        if(previousSegment && volunteerStart.isBefore(previousSegment.endTime)){
                            for (var i = 0; i < volunteerDuration; i++) {
                                volunteer.hours.push(moment(volunteerStart._d).add((i + hoursToAdd), 'hours')); 
                            }
                        } else {
                            for (var i = 0; i < volunteerDuration; i++) {
                                volunteer.hours.push(moment(volunteerStart._d).add(i , 'hours')); 
                            }
                        }
                        volunteer.id = value.id
                        volunteer.event = event.$id;
                        volunteer.fbKey = key;
                    }
                    volunteerArr.push(volunteer);
                });
            }
            
            iterations++;
            if(volunteerArr.length > 0){
                // Sort volunteer objects by the # of hrs volunteered in the segment in descending order
                volunteerArr = $filter('orderBy')(volunteerArr, '-hours.length');// Pushes them further right in the view 
                var rowArr= [],
                    start = segmentStart._i,
                    grid = (function(){//creates a grid w/ rows for hrs in event segment & slots for # of volunteers needed
                        for(var i = 0; i < newObj.totalApptTime; i++){
                            var row = [],
                                hour = moment(start).add(i, 'hours');
                            for(var x = 0; x < newObj.volunteersNeeded; x++){
                                row.push(hour);
                            }
                            rowArr.push(row);
                        }
                        return rowArr;
                    })();
                //  y1 = length of the job segment(ie setup, main event, cleanup) in hours
                //  y2 = # of hours a volunteer has signed up for
                //                      |y
                //                      |
                //                      |
                //                      |
                //                      |
                //                      |
                //                      |
                // x ------------------- 
                //  x1 = available slots for volunteers in an hour
                //  x2 = # of volunteers
                var match;
                for (var y1 = grid.length - 1; y1 >= 0; y1--) {//iterates over grid rows
                    for (var x2 = volunteerArr.length - 1; x2 >= 0; x2--) {//iterates over volunteers
                        if(volunteerArr[x2].hours.length > 0){// Make sure this volunteer has some hours in this segment
                            for (var y2 = volunteerArr[x2].hours.length - 1; y2 >= 0; y2--) {//iterates a volunteer's hours
                                for (var x1 = grid[y1].length - 1; x1 >= 0; x1--) {// iterates over slots 
                                    if(moment.isMoment(grid[y1][x1]) && (grid[y1][x1]).isSame(volunteerArr[x2].hours[y2])){//matches volunteer signup hr to grid slot & checks slot if available
                                        grid[y1].splice(x1, 1, volunteerArr[x2]);
                                        match = true;
                                        break;
                                    }
                                }
                            }
                        } else {
                            continue;
                        }
                    }
                }
                newObj.grid = grid;
                if(iterations < $scope.eventSource.length){
                    $scope.arrayify(event, $scope.eventSource[$scope.eventSource.length - (iterations + 1)])
                }
            } 
        }

        $scope.adminInteract = function(e, eventId){
            var slots = e.currentTarget.children,
                child,
                userId,
                volunteer,
                volunteerId,
                eventRef = ref.child('events').child(eventId),
                fbEventRef = $firebaseObject(eventRef),
                volunteersRef = eventRef.child('volunteers'),
                i = slots.length - 1;
            $scope.thisEvent = {};
            fbEventRef.$loaded(function(data){
                $scope.thisEvent.id = data.$id;
                $scope.thisEvent.date = moment(data.event_start);
                $scope.thisEvent.title = data.title;
                $scope.thisEvent.setup_start = moment(data.setup_start);
                $scope.thisEvent.setup_end = moment(data.setup_end);
                $scope.thisEvent.setup_total = moment(data.setup_end).diff(data.setup_start, 'minutes');

                $scope.thisEvent.event_start = moment(data.event_start);
                $scope.thisEvent.event_end = moment(data.event_end);
                $scope.thisEvent.event_total = moment(data.event_end).diff(data.event_start, 'minutes');

                $scope.thisEvent.cleanup_start = moment(data.cleanup_start);
                $scope.thisEvent.cleanup_end = moment(data.cleanup_end);
                $scope.thisEvent.cleanup_total = moment(data.cleanup_end).diff(data.cleanup_start, 'minutes');

                $scope.thisEvent.total_time = moment(data.cleanup_end).diff(data.setup_start, 'minutes');
            });
            $scope.thisHoursVolunteers = [];
            function getVolunteersFromFB(){
                if(slots[i] && slots[i].children[0]){
                    child = angular.element(slots[i].children[0]);
                    volunteer = {};
                    volunteer.user = usersRef.$getRecord(child.attr('data-user-id'));
                    $firebaseObject(volunteersRef.child(child.attr('data-volunteer-id'))).$loaded()
                    .then(function(data){
                            volunteer.start = moment(data.start);
                            volunteer.end = moment(data.end); 
                            volunteer.total_time = moment(data.end).diff(data.start, 'minutes');
                            if($scope.thisEvent.setup_start){
                                volunteer.marginLeft  = ((volunteer.start.diff($scope.thisEvent.setup_start, 'minutes'))/$scope.thisEvent.total_time * 100) + '%';
                            } else if($scope.thisEvent.event_start){
                                volunteer.marginLeft  = ((volunteer.start.diff($scope.thisEvent.event_start, 'minutes'))/$scope.thisEvent.total_time * 100) + '%';
                            } else {
                                volunteer.marginLeft  = ((volunteer.start.diff($scope.thisEvent.cleanup_start, 'minutes'))/$scope.thisEvent.total_time * 100) + '%';
                            }
                            $scope.thisHoursVolunteers.push(volunteer);
                            i--;
                            if(i >= 0){
                                getVolunteersFromFB();
                            }
                    })
                    .catch(function(error){
                        debugger;
                    });
                } else if( i >= 0){
                    i--;
                    getVolunteersFromFB();
                }
                if(i < 0) {
                    $state.go('app.calendar.volunteers', {thisHoursVolunteers: $scope.thisHoursVolunteers, thisEvent: $scope.thisEvent});
                }
            }
            getVolunteersFromFB()
        }

        $scope.setBorderStyle = function(color){
            if(color === 'primaryGreen'){
                return {'border-radius':'5px 0 0 0'};
            } else if(color === 'primaryRed'){
                return {'border-radius':'0 0 0 5px'};
            } else {
                return {'border-radius':'0'};
            }
        }

        $scope.$on('eventFilter', function(eventType){
            var unfilteredEvents = $scope.eventSource;
            $scope.filteredEvents =[];
            for (var i = unfilteredEvents.length - 1; i >= 0; i--) {
              if(unfilteredEvents[i].type === eventType.targetScope.itemSelected.type){
                $scope.filteredEvents.push(unfilteredEvents[i]);
              } else if(i === 0 && $scope.filteredEvents.length === 0){
                $scope.filteredEvents = $scope.eventSource;
              }
            }
        });

        $scope.selectedHour = {};

        $scope.endHour = function(startHour){
            var endHour,
                hrRegEx = /^\w+/g;
            if(!parseInt(hrRegEx.exec(startHour)[0])){
               var startHour = "12:00 pm";
            }
            hrRegEx.lastIndex = 0;
            var hour = parseInt(hrRegEx.exec(startHour)[0]),
                merideanRegEx = /am|pm/g,
                meridean = merideanRegEx.exec(startHour)[0];
            if(hour === 12){
                endHour = "1:00 " + meridean;
            } else if(hour === 11) {
                if(meridean === "am"){
                    meridean = "pm";
                } else {
                    meridean = "am";
                }
                endHour = "12:00 " + meridean;
            } else {
                endHour = hour + 1 + ":00 " + meridean;
            }
            return endHour;
        }

        //Determine if we're in the Calendar or Volunteer view
        if($ionicHistory.currentView().stateName === 'app.admin.calendar'){
            $scope.isCalView = true;
        } else {
            $scope.isCalView = false;
        }

        $scope.signupShown = false;
        $scope.cancelSignup = function(){
            if($scope.selectedHour.el){
                var signup = angular.element($scope.selectedHour.el.firstElementChild);
                $scope.dragEl.style.display= "none";
                signup.html("Signup")
                      .removeClass('volunteer-start')
                      .css("display", "none");
                $scope.displayEnd = null;
                $scope.selectedHour.el = null;
                $scope.signupShown = false;
                $scope.dropped = true;
            }
        }

        dragulaService.options($scope, '"bag"', {
            moves: function (el, container, handle) {
                return handle.className === 'drag-element';
            }
        });

        $scope.$on('bag.cloned', function(e, el){
            el.attr('offset-top', 'top');
            el.attr('drag-watch', '');
            $scope.targetEl = angular.element(document.getElementsByClassName('gu-transit')[0])
            $scope.targetEl.addClass('gu-hide');
            $compile(el)($scope);
            (function forceFeed(newValue){
                if(!$scope.dropped){
                    $timeout(function(){
                        $scope.$digest();
                        forceFeed();
                    }, false);
                }
            })();
        });

        $scope.filterEventsByDate = function(array, filterBy, prop){
            var filteredEvents = []
            var filter = moment(filterBy, 'DD-MM-YYYY');
            for (var i = array.length - 1; i >= 0; i--) {
                var checkDate = moment(array[i][prop], 'DD-MM-YYYY');
                if(checkDate.isSame(filter)){
                    filteredEvents.push(array[i]);
                }
            }
            return filteredEvents;
        }

        $scope.$on('bag.drag', function(el, source){
                var eventSource = $scope.filterEventsByDate(el.currentScope.eventSource, $scope.$parent.$parent.currentDate, 'startTime'),
                latestFinish;
                angular.element(source[0]).css('width', '190px');
            $scope.latestFinish = (function(){// Set the latest a volunteer may finish
                if(eventSource.length === 3){// Check if the event has cleanup or not
                    latestFinish = moment($filter('filter')(eventSource, {type: 'cleanup'})[0].endTime);// Cleanup end time
                } else {
                    latestFinish = moment($filter('filter')(eventSource, {type: 'event'})[0].endTime);// Event end time
                }
                return latestFinish;
            })();
            $scope.targetInitParent = source.parent();
        });

        $scope.dropped = false;
        $scope.handleDrop = function(){
            $scope.dropped = true;
            var doubleSignup = false,
                doubleSignupArr = [],
                actionsheetTitle = '';
            angular.forEach($scope.selectedEvent.volunteers, function(value, key){
                if(value.id === $scope.user.user_id){
                    doubleSignupArr.push(value);
                    doubleSignup = true;
                }
            });
            if(!doubleSignup){
                $scope.$emit('displayTimes', $scope.displayStart, $scope.displayEnd);
                $scope.$parent.confirmSignup();
                $scope.targetInitParent.prepend($scope.targetEl);
                $scope.targetEl.removeClass('gu-hide gu-transit');
                $scope.cancelSignup();
            } else {
                for (var i = doubleSignupArr.length - 1; i >= 0; i--) {
                    if(i === doubleSignupArr.length - 1){
                        actionsheetTitle = moment(doubleSignupArr[i].start).format('ha') +  ' to ' + moment(doubleSignupArr[i].end).format('ha');
                    } else if (i >= 0 && doubleSignupArr.length > 1){
                        actionsheetTitle = actionsheetTitle + ' and from ' + moment(doubleSignupArr[i].start).format('ha') +  ' to ' + moment(doubleSignupArr[i].end).format('ha');
                    }
                }
                var undoActionSheet = $ionicActionSheet.show({
                    buttons: [],
                    titleText: "You are already signed up from " + actionsheetTitle + ". Please choose another time." ,
                    cssClass: 'double-signup-actionsheet',
                    cancel: function(){
                        $scope.targetInitParent.prepend($scope.targetEl);
                        $scope.targetEl.removeClass('gu-hide gu-transit');
                        $scope.cancelSignup();
                    }
                });
            }
        }

        $scope.$on('bag.drop', function(el, target, source){
            angular.element(target[0]).css('width', '');
            $scope.handleDrop();
        });
        
        // Treat a cancel event like a drop event because we're not using
        // Angular-Dragula's drop containers in our logic
        $scope.$on('bag.cancel', function(el, container, source){
            $scope.handleDrop();
        });


        $scope.hourTouch = function($event){
            // Grab the date displayed in the calendar title bar
            var title = $scope.$parent.$parent.titleDate;

            if(!$scope.signupShown && $scope.selectedHour.el && $scope.selectedHour.hashKey !== $event.currentTarget.$$hashKey){//selected a different hour
                $event.currentTarget.firstElementChild.style.display = "inline-block";
                $scope.selectedHour.el.firstElementChild.style.display = "none";
                $scope.selectedHour.el = $event.currentTarget;
                $scope.selectedHour.hashKey = $event.currentTarget.$$hashKey;
            } else if($scope.selectedHour.el && $scope.selectedHour.hashKey === $event.currentTarget.$$hashKey){//selected the same hour again
                var children = angular.element($scope.selectedHour.el).parent();
                $scope.selectedHour.hashKey = null; 
                if($scope.isCalView){
                    $scope.event = {}
                    var start = children.children().eq(children.children().length - 1).html();
                    if(start.length > 8){//Setting a new event from the week view
                        $scope.event.start_date = new Date(angular.element($event.target).next().html());
                        $scope.event.start_time = new Date(angular.element($event.target).next().html());
                        $scope.event.end_date = new Date(angular.element($event.target).next().html());
                        $scope.event.end_time = new Date(moment(angular.element($event.target).next().html()).add(2, 'hours'));
                    } else {// Setting a new event from the day view
                        $scope.volunteerStart = moment(new Date(title + " " +  start));
                        $scope.displayStart = $scope.volunteerStart.format('h:mm a');
                        $scope.event.start_date = new Date(title);
                        $scope.event.end_date = new Date(title);
                        $scope.event.start_time = new Date(title + " " + start);
                        $scope.event.end_time = new Date(title + " " + $scope.endHour(start));
                    }
                    $scope.$emit('timeSelected', $scope.event);  
                } else {
                    var start = children.parent().children().eq(children.parent().children().length - 1).html();
                    $scope.volunteerStart = moment(new Date(title + " " +  start));
                    $scope.earliestFinish = moment($scope.volunteerStart._d).add(1, 'hours');
                    $scope.displayStart = $scope.volunteerStart.format('h:mm a');
                    $scope.selectedHour.el.firstElementChild.innerHTML = "Start: " + $scope.displayStart;
                    $scope.selectedHour.el.firstElementChild.className = "volunteer-start";
                    $scope.selectedHour.el.firstElementChild.style.display = "inline-block"
                    $scope.displayEnd = $scope.volunteerStart.add(1, 'h').format('h:mm a');
                    var selectedHour = angular.element($scope.selectedHour.el);
                    $scope.dragEl = selectedHour.parent().next().children()[0];
                    $scope.dragEl.style.display = 'inherit';
                    $scope.dropped = false;
                    $timeout(function(){
                        $scope.signupShown = true;
                    }, 500);
                }
            } else if(!$scope.signupShown) {//first hour selection made
                $event.currentTarget.firstElementChild.style.display = "inline-block"; 
                $scope.selectedHour.el = $event.currentTarget;
                $scope.selectedHour.hashKey = $event.currentTarget.$$hashKey
            }
        }
        
        var self = this,
            ngModelCtrl = {$setViewValue: angular.noop}; // nullModelCtrl;

        // Configuration attributes
        angular.forEach(['formatDay', 'formatDayHeader', 'formatDayTitle', 'formatWeekTitle', 'formatMonthTitle',
            'showWeeks', 'showEventDetail', 'startingDay', 'filteredEvents', 'queryMode'], function (key, index) {
            self[key] = angular.isDefined($attrs[key]) ? (index < 5 ? $interpolate($attrs[key])($scope.$parent) : $scope.$parent.$eval($attrs[key])) : calendar2Config[key];
        });
        $scope.$watch('filteredEvents', function (value) {
            self.onEventSourceChanged(value);
        });

        $scope.calendarMode = $scope.calendarMode || calendar2Config.calendarMode;
        if (angular.isDefined($attrs.initDate)) {
            self.currentCalendarDate = $scope.$parent.$eval($attrs.initDate);
        }
        if (!self.currentCalendarDate) {
            self.currentCalendarDate = new Date();
            if ($attrs.ngModel && !$scope.$parent.$eval($attrs.ngModel)) {
                $parse($attrs.ngModel).assign($scope.$parent, self.currentCalendarDate);
            }
        }

        self.init = function (ngModelCtrl_) {
            ngModelCtrl = ngModelCtrl_;

            ngModelCtrl.$render = function () {
                self.render();
            };
        };

        self.render = function () {
            if (ngModelCtrl.$modelValue) {
                var date = new Date(ngModelCtrl.$modelValue),
                    isValid = !isNaN(date);

                if (isValid) {
                    this.currentCalendarDate = date;
                } else {
                    $log.error('"ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
                }
                ngModelCtrl.$setValidity('date', isValid);
            }
            this.refreshView();
        };

        self.refreshView = function () {
            if (this.mode) {
                this.range = this._getRange(this.currentCalendarDate);
                this._refreshView();
                this.rangeChanged();
            }
        };

        // Split array into smaller arrays
        self.split = function (arr, size) {
            var arrays = [];
            while (arr.length > 0) {
                arrays.push(arr.splice(0, size));
            }
            return arrays;
        };

        self.onEventSourceChanged = function (value) {
            self.filteredEvents = value;
            if (self._onDataLoaded) {
                self._onData.Loaded();
            }
        };

        $scope.move = function (direction) {
            var step = self.mode.step,
                currentCalendarDate = self.currentCalendarDate,
                year = currentCalendarDate.getFullYear() + direction * (step.years || 0),
                month = currentCalendarDate.getMonth() + direction * (step.months || 0),
                date = currentCalendarDate.getDate() + direction * (step.days || 0),
                firstDayInNextMonth;

            currentCalendarDate.setFullYear(year, month, date);
            if ($scope.calendarMode === 'month') {
                firstDayInNextMonth = new Date(year, month + 1, 1);
                if (firstDayInNextMonth.getTime() <= currentCalendarDate.getTime()) {
                    self.currentCalendarDate = new Date(firstDayInNextMonth - 24 * 60 * 60 * 1000);
                }
            }
            ngModelCtrl.$setViewValue(self.currentCalendarDate);
            self.refreshView();
        };

        self.rangeChanged = function () {
            if (self.queryMode === 'local') {
                if (self.filteredEvents && self._onDataLoaded) {
                    self._onDataLoaded();
                }
            } else if (self.queryMode === 'remote') {
                if ($scope.rangeChanged) {
                    $scope.rangeChanged({
                        startTime: this.range.startTime,
                        endTime: this.range.endTime
                    });
                }
            }
        };

        function overlap(event1, event2) {
            if (event1.endIndex <= event2.startIndex || event2.endIndex <= event1.startIndex) {
                return false;
            }
            return true;
        }


        // Creates the "events.position" number to tell which column the event is in (i.e 0, 1, 2 if there are 3 simultaneous events)
        function calculatePosition(events) {
            var i,
                j,
                len = events.length,
                maxColumn = 0,
                col,
                isForbidden = new Array(len);

            for (i = 0; i < len; i += 1) {
                for (col = 0; col < maxColumn; col += 1) {
                    isForbidden[col] = false;
                }
                for (j = 0; j < i; j += 1) {
                    if (overlap(events[i], events[j])) {
                        isForbidden[events[j].position] = true;
                    }
                }
                for (col = 0; col < maxColumn; col += 1) {
                    if (!isForbidden[col]) {
                        break;
                    }
                }
                if (col < maxColumn) {
                    events[i].position = col;
                } else {
                    events[i].position = maxColumn++;
                }
            }
        }

        // Creates 24 item array for each hour of the day and put events in each one hour block if there is an event at that time (or multiple events)
        // "cell" is the array that contains the output
        function calculateWidth(orderedEvents) {
            var cells = new Array(24),
                event,
                index,
                i,
                j,
                len,
                eventCountInCell,
                currentEventInCell;

            //sort by position in descending order, the right most columns should be calculated first
            orderedEvents.sort(function (eventA, eventB) {
                return eventB.position - eventA.position;
            });
            for (i = 0; i < 24; i += 1) {
                cells[i] = {
                    calculated: false,
                    events: []
                };
            }
            len = orderedEvents.length;
            for (i = 0; i < len; i += 1) {
                event = orderedEvents[i];
                index = event.startIndex;
                while (index < event.endIndex) {
                    cells[index].events.push(event);
                    index += 1;
                }
            }

            i = 0;
            while (i < len) {
                event = orderedEvents[i];
                if (!event.overlapNumber) {
                    var overlapNumber = event.position;
                    event.overlapNumber = overlapNumber;
                    var eventQueue = [event];
                    while ((event = eventQueue.shift())) {
                        index = event.startIndex;
                        while (index < event.endIndex) {
                            if (!cells[index].calculated) {
                                cells[index].calculated = true;
                                if (cells[index].events) {
                                    eventCountInCell = cells[index].events.length;
                                    for (j = 0; j < eventCountInCell; j += 1) {
                                        currentEventInCell = cells[index].events[j];
                                        if (!currentEventInCell.overlapNumber) {
                                            currentEventInCell.overlapNumber = overlapNumber;
                                            eventQueue.push(currentEventInCell);
                                        }
                                    }
                                }
                            }
                            index += 1;
                        }
                    }
                }
                i += 1;
            }
        }

        self.placeEvents = function (orderedEvents) {
            calculatePosition(orderedEvents);
            calculateWidth(orderedEvents);
        };

        self.placeAllDayEvents = function (orderedEvents) {
            calculatePosition(orderedEvents);
        };
    }])
    .directive('calendar', function () {
        'use strict';
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'templates/rcalendar/calendar.html',
            scope: {
                calendarMode: '=',
                rangeChanged: '&',
                eventSelected: '&',
                timeSelected: '&'
            },
            require: ['calendar', '?^ngModel'],
            controller: 'CalendarController',
            link: function (scope, element, attrs, ctrls) {
                var calendar2Ctrl = ctrls[0], ngModelCtrl = ctrls[1];

                if (ngModelCtrl) {
                    calendar2Ctrl.init(ngModelCtrl);
                }

                scope.$on('eventSourceChanged', function (event, value) {
                    calendar2Ctrl.onEventSourceChanged(value);
                });
            }
        };
    })
    .directive('monthview2', ['dateFilter', function (dateFilter) {
        'use strict';
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'templates/rcalendar/month.html',
            require: ['^calendar', '?^ngModel'],
            link: function (scope, element, attrs, ctrls) {
                var ctrl = ctrls[0],
                    ngModelCtrl = ctrls[1];
                scope.showWeeks = ctrl.showWeeks;
                scope.showEventDetail = ctrl.showEventDetail;

                ctrl.mode = {
                    step: {months: 1}
                };

                function getDates(startDate, n) {
                    var dates = new Array(n), current = new Date(startDate), i = 0;
                    current.setHours(12); // Prevent repeated dates because of timezone bug
                    while (i < n) {
                        dates[i++] = new Date(current);
                        current.setDate(current.getDate() + 1);
                    }
                    return dates;
                }

                scope.select = function (selectedDate) {
                    var rows = scope.rows;
                    if (rows) {
                        var currentCalendarDate = ctrl.currentCalendarDate;
                        var currentMonth = currentCalendarDate.getMonth();
                        var currentYear = currentCalendarDate.getFullYear();
                        var selectedMonth = selectedDate.getMonth();
                        var selectedYear = selectedDate.getFullYear();
                        var direction = 0;
                        if (currentYear === selectedYear) {
                            if (currentMonth !== selectedMonth) {
                                direction = currentMonth < selectedMonth ? 1 : -1;
                            }
                        } else {
                            direction = currentYear < selectedYear ? 1 : -1;
                        }

                        ctrl.currentCalendarDate = selectedDate;
                        if (ngModelCtrl) {
                            ngModelCtrl.$setViewValue(selectedDate);
                        }
                        if (direction === 0) {
                            for (var row = 0; row < 6; row += 1) {
                                for (var date = 0; date < 7; date += 1) {
                                    var selected = ctrl.compare(selectedDate, rows[row][date].date) === 0;
                                    rows[row][date].selected = selected;
                                    if (selected) {
                                        scope.selectedDate = rows[row][date];
                                    }
                                }
                            }
                        } else {
                            ctrl.refreshView();
                        }

                        if (scope.timeSelected) {
                            scope.timeSelected({selectedTime: selectedDate});
                        }
                    }
                };

                ctrl._refreshView = function () {
                    var startDate = ctrl.range.startTime,
                        date = startDate.getDate(),
                        month = (startDate.getMonth() + (date !== 1 ? 1 : 0)) % 12,
                        year = startDate.getFullYear() + (date !== 1 && month === 0 ? 1 : 0);

                    var days = getDates(startDate, 42);
                    for (var i = 0; i < 42; i++) {
                        days[i] = angular.extend(createDateObject(days[i], ctrl.formatDay), {
                            secondary: days[i].getMonth() !== month
                        });
                    }

                    scope.labels = new Array(7);
                    for (var j = 0; j < 7; j++) {
                        scope.labels[j] = dateFilter(days[j].date, ctrl.formatDayHeader);
                    }

                    var headerDate = new Date(year, month, 1);
                    scope.$parent.$parent.$parent.titleDate = dateFilter(headerDate, ctrl.formatMonthTitle);
                    scope.rows = ctrl.split(days, 7);

                    if (scope.showWeeks) {
                        scope.weekNumbers = [];
                        var weekNumber = getISO8601WeekNumber(scope.rows[0][0].date),
                            numWeeks = scope.rows.length,
                            len = 0;
                        while (len < numWeeks) {
                            len = scope.weekNumbers.push(weekNumber);
                            weekNumber += 1;
                        }
                    }
                };

                function createDateObject(date, format) {
                    return {
                        date: date,
                        label: dateFilter(date, format),
                        selected: ctrl.compare(date, ctrl.currentCalendarDate) === 0,
                        current: ctrl.compare(date, new Date()) === 0
                    };
                }

                function compareEvent(event1, event2) {}

                ctrl._onDataLoaded = function () {
                    var startDate = ctrl.range.startTime,
                        date = startDate.getDate(),
                        month = (startDate.getMonth() + (date !== 1 ? 1 : 0)) % 12,
                        year = startDate.getFullYear() + (date !== 1 && month === 0 ? 1 : 0);

                    var days = getDates(startDate, 42);
                    for (var i = 0; i < 42; i++) {
                        days[i] = angular.extend(createDateObject(days[i], ctrl.formatDay), {
                            secondary: days[i].getMonth() !== month
                        });
                    }

                    scope.labels = new Array(7);
                    for (var j = 0; j < 7; j++) {
                        scope.labels[j] = dateFilter(days[j].date, ctrl.formatDayHeader);
                    }

                    var headerDate = new Date(year, month, 1);
                    scope.$parent.$parent.$parent.titleDate = dateFilter(headerDate, ctrl.formatMonthTitle);
                    scope.rows = ctrl.split(days, 7);
                    var filteredEvents = ctrl.filteredEvents,
                        len = filteredEvents ? filteredEvents.length : 0,
                        startTime = ctrl.range.startTime,
                        endTime = ctrl.range.endTime,
                        timeZoneOffset = -new Date().getTimezoneOffset(),
                        utcStartTime = new Date(startTime.getTime() + timeZoneOffset * 60 * 1000),
                        utcEndTime = new Date(endTime.getTime() + timeZoneOffset * 60 * 1000),
                        rows = scope.rows,
                        oneDay = 24 * 3600 * 1000,
                        eps = 0.001,
                        row,
                        date;

                    for (var i = 0; i < len; i += 1) {
                        var event = filteredEvents[i];
                        var eventStartTime = new Date(event.startTime);
                        var eventEndTime = new Date(event.endTime);
                        var st;
                        var et;

                        if (event.allDay) {
                            if (eventEndTime <= utcStartTime || eventStartTime >= utcEndTime) {
                                continue;
                            } else {
                                st = utcStartTime;
                                et = utcEndTime;
                            }
                        } else {
                            if (eventEndTime <= startTime || eventStartTime >= endTime) {
                                continue;
                            } else {
                                st = startTime;
                                et = endTime;
                            }
                        }

                        var timeDifferenceStart;
                        if (eventStartTime <= st) {
                            timeDifferenceStart = 0;
                        } else {
                            timeDifferenceStart = (eventStartTime - st) / oneDay;
                        }

                        var timeDifferenceEnd;
                        if (eventEndTime >= et) {
                            timeDifferenceEnd = (et - st) / oneDay;
                        } else {
                            timeDifferenceEnd = (eventEndTime - st) / oneDay;
                        }

                        var index = Math.floor(timeDifferenceStart);
                        var eventSet;
                        while (index < timeDifferenceEnd - eps) {
                            var rowIndex = Math.floor(index / 7);
                            var dayIndex = Math.floor(index % 7);
                            rows[rowIndex][dayIndex].hasEvent = true;
                            eventSet = rows[rowIndex][dayIndex].events;
                            if (eventSet) {
                                eventSet.push(event);
                            } else {
                                eventSet = [];
                                eventSet.push(event);
                                rows[rowIndex][dayIndex].events = eventSet;
                            }
                            index += 1;
                        }
                    }

                    for (row = 0; row < 6; row += 1) {
                        for (date = 0; date < 7; date += 1) {
                            if (rows[row][date].hasEvent) {
                                rows[row][date].events.sort(compareEvent);
                            }
                        }
                    }

                    var findSelected = false;
                    for (row = 0; row < 6; row += 1) {
                        for (date = 0; date < 7; date += 1) {
                            if (rows[row][date].selected) {
                                scope.selectedDate = rows[row][date];
                                findSelected = true;
                                break;
                            }
                        }
                        if (findSelected) {
                            break;
                        }
                    }
                };

                ctrl.compare = function (date1, date2) {
                    return (new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) - new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()) );
                };

                ctrl._getRange = function getRange(currentDate) {
                    var year = currentDate.getFullYear(),
                        month = currentDate.getMonth(),
                        firstDayOfMonth = new Date(year, month, 1),
                        difference = ctrl.startingDay - firstDayOfMonth.getDay(),
                        numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : -difference,
                        startDate = new Date(firstDayOfMonth),
                        endDate;

                    if (numDisplayedFromPreviousMonth > 0) {
                        startDate.setDate(-numDisplayedFromPreviousMonth + 1);
                    }

                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 42);

                    return {
                        startTime: startDate,
                        endTime: endDate
                    };
                };

                function getISO8601WeekNumber(date) {
                    var checkDate = new Date(date);
                    checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
                    var time = checkDate.getTime();
                    checkDate.setMonth(0); // Compare with Jan 1
                    checkDate.setDate(1);
                    return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
                }

                ctrl.refreshView();
            }
        };
    }])
    .directive('weekview2', ['dateFilter', '$timeout', function (dateFilter, $timeout) {
        'use strict';
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'templates/rcalendar/week.html',
            require: '^calendar',
            link: function (scope, element, attrs, ctrl) {
                $timeout(function () {
                    // updateScrollGutter();
                });

                ctrl.mode = {
                    step: {days: 7}
                };

                function updateScrollGutter() {}

                function getDates(startTime, n) {
                    var dates = new Array(n),
                        current = new Date(startTime),
                        i = 0;
                    current.setHours(12); // Prevent repeated dates because of timezone bug
                    while (i < n) {
                        dates[i++] = {
                            date: new Date(current)
                        };
                        current.setDate(current.getDate() + 1);
                    }
                    return dates;
                }

                function createDateObjects(startTime) {
                    var times = [],
                        row,
                        time = new Date(startTime.getTime()),
                        currentHour = time.getHours(),
                        currentDate = time.getDate();

                    for (var hour = 0; hour < 24; hour += 1) {
                        row = [];
                        time = new Date(startTime.getTime());
                        for (var day = 0; day < 7; day += 1) {
                            time.setHours(currentHour + hour);
                            time.setDate(currentDate + day);
                            row.push({
                                time: new Date(time.getTime())
                            });
                        }
                        times.push(row);
                    }
                    return times;
                }

                ctrl._onDataLoaded = function () {
                    var firstDayOfWeek = ctrl.range.startTime,
                        dates = getDates(firstDayOfWeek, 7),
                        weekNumberIndex,
                        weekFormatPattern = 'w',
                        title;
                    scope.rows = createDateObjects(firstDayOfWeek);
                    var filteredEvents = ctrl.filteredEvents,
                        len = filteredEvents ? filteredEvents.length : 0,
                        startTime = ctrl.range.startTime,
                        endTime = ctrl.range.endTime,
                        timeZoneOffset = -new Date().getTimezoneOffset(),
                        utcStartTime = new Date(startTime.getTime() + timeZoneOffset * 60 * 1000),
                        utcEndTime = new Date(endTime.getTime() + timeZoneOffset * 60 * 1000),
                        rows = scope.rows,
                        dates = scope.dates,
                        oneHour = 3600 * 1000,
                        oneDay = 24 * 3600 * 1000,
                    //add allday eps
                        eps = 0.016,
                        eventSet,
                        allDayEventInRange = false,
                        normalEventInRange = false;
               
                    for (var i = 0; i < len; i += 1) {
                        var event = filteredEvents[i];
                        var eventStartTime = new Date(event.startTime);
                        var eventEndTime = new Date(event.endTime);

                        if (event.allDay) {
                            if (eventEndTime <= utcStartTime || eventStartTime >= utcEndTime) {
                                continue;
                            } else {
                                allDayEventInRange = true;

                                var allDayStartIndex;
                                if (eventStartTime <= utcStartTime) {
                                    allDayStartIndex = 0;
                                } else {
                                    allDayStartIndex = Math.floor((eventStartTime - utcStartTime) / oneDay);
                                }

                                var allDayEndIndex;
                                if (eventEndTime >= utcEndTime) {
                                    allDayEndIndex = Math.ceil((utcEndTime - utcStartTime) / oneDay);
                                } else {
                                    allDayEndIndex = Math.ceil((eventEndTime - utcStartTime) / oneDay);
                                }

                                var displayAllDayEvent = {
                                    event: event,
                                    startIndex: allDayStartIndex,
                                    endIndex: allDayEndIndex
                                };

                                eventSet = dates[allDayStartIndex].events;
                                if (eventSet) {
                                    eventSet.push(displayAllDayEvent);
                                } else {
                                    eventSet = [];
                                    eventSet.push(displayAllDayEvent);
                                    dates[allDayStartIndex].events = eventSet;
                                }
                            }
                        } else {
                            if (eventEndTime <= startTime || eventStartTime >= endTime) {//checking to make sure event is in week display range
                                continue;
                            } else {
                                normalEventInRange = true;

                    //VVVVVVVVVV calculating job start and end relative to the start of the visible week VVVVVV
                                var timeDifferenceStart;
                                if (eventStartTime <= startTime) {
                                    timeDifferenceStart = 0;
                                } else {
                                    timeDifferenceStart = (eventStartTime - startTime) / oneHour;
                                }

                                var timeDifferenceEnd;
                                if (eventEndTime >= endTime) {
                                    timeDifferenceEnd = (endTime - startTime) / oneHour;
                                } else {
                                    timeDifferenceEnd = (eventEndTime - startTime) / oneHour;
                                }

                                var startIndex = Math.floor(timeDifferenceStart);
                                var endIndex = Math.ceil(timeDifferenceEnd - eps);
                                var startRowIndex = startIndex % 24;
                                var dayIndex = Math.floor(startIndex / 24);
                                var endOfDay = dayIndex * 24;
                                var endRowIndex;
                    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                do {
                                    endOfDay += 24;
                                    if (endOfDay <= endIndex) {
                                        endRowIndex = 24;
                                    } else {
                                        endRowIndex = endIndex % 24;
                                    }
                                    var displayEvent = {
                                        event: event,
                                        startIndex: startRowIndex,
                                        endIndex: endRowIndex
                                    };
                                    eventSet = rows[startRowIndex][dayIndex].events;
                                    if (eventSet) {
                                        eventSet.push(displayEvent);
                                    } else {
                                        eventSet = [];
                                        eventSet.push(displayEvent);
                                        rows[startRowIndex][dayIndex].events = eventSet;
                                    }
                                    startRowIndex = 0;
                                    dayIndex += 1;
                                } while (endOfDay < endIndex);
                            }
                        }
                    }

                    var day;
                    if (normalEventInRange) {
                        for (day = 0; day < 7; day += 1) {
                            var orderedEvents = [];
                            for (var hour = 0; hour < 24; hour += 1) {
                                if (rows[hour][day].events) {
                                    orderedEvents = orderedEvents.concat(rows[hour][day].events);
                                }
                            }
                            if (orderedEvents.length > 0) {
                                ctrl.placeEvents(orderedEvents);
                            }
                        }
                    }

                    if (allDayEventInRange) {
                        var orderedAllDayEvents = [];
                        for (day = 0; day < 7; day += 1) {
                            if (dates[day].events) {
                                orderedAllDayEvents = orderedAllDayEvents.concat(dates[day].events);
                            }
                        }
                        if (orderedAllDayEvents.length > 0) {
                            ctrl.placeAllDayEvents(orderedAllDayEvents);
                        }
                    }

                    $timeout(function () {
                        updateScrollGutter();
                    });
                };

                ctrl._refreshView = function () {
                    var firstDayOfWeek = ctrl.range.startTime,
                        dates = getDates(firstDayOfWeek, 7),
                        weekNumberIndex,
                        weekFormatPattern = 'w',
                        monthOne = moment(dates[0].date).format('MMM'),
                        monthTwo = moment(dates[6].date).format('MMM'), 
                        dateOne = moment(dates[0].date),
                        dateTwo = moment(dates[6].date), 
                        title;

                    scope.rows = createDateObjects(firstDayOfWeek);
                    scope.dates = dates;
                    weekNumberIndex = ctrl.formatWeekTitle.indexOf(weekFormatPattern);
                    if(monthOne === monthTwo){
                        title = monthOne + " " + dateOne.format('Do') + " - " + dateTwo.format('Do');
                    } else {
                        title = dateOne.format('MMM Do') + " - " + dateTwo.format('MMM Do') ;
                    }
                    scope.$parent.$parent.$parent.titleDate = title;
                };

                ctrl._getRange = function getRange(currentDate) {
                    var year = currentDate.getFullYear(),
                        month = currentDate.getMonth(),
                        date = currentDate.getDate(),
                        day = currentDate.getDay(),
                        firstDayOfWeek = new Date(year, month, date - day),
                        endTime = new Date(year, month, date - day + 7);

                    return {
                        startTime: firstDayOfWeek,
                        endTime: endTime
                    };
                };

                //This can be decomissioned when upgrade to Angular 1.3
                function getISO8601WeekNumber(date) {
                    var checkDate = new Date(date);
                    checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
                    var time = checkDate.getTime();
                    checkDate.setMonth(0); // Compare with Jan 1
                    checkDate.setDate(1);
                    return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
                }

                ctrl.refreshView();
            }
        };
    }])
    .directive('dayview2', ['dateFilter', '$timeout', function (dateFilter, $timeout) {
        'use strict';
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'templates/rcalendar/day.html',
            require: '^calendar',
            link: function (scope, element, attrs, ctrl) {
                
                $timeout(function () {
                    updateScrollGutter();
                });

                ctrl.mode = {
                    step: {days: 1}
                };

                function updateScrollGutter() {
                }

                function createDateObjects(startTime) {
                    var rows = [],
                        time = new Date(startTime.getTime()),
                        currentHour = time.getHours(),
                        currentDate = time.getDate();

                    for (var hour = 0; hour < 24; hour += 1) {
                        time.setHours(currentHour + hour);
                        time.setDate(currentDate);
                        rows.push({
                            time: new Date(time.getTime())
                        });
                    }
                    return rows;
                }

                ctrl._onDataLoaded = function () {
                    var startingDate = ctrl.range.startTime;
                    scope.rows = createDateObjects(startingDate);
                    var filteredEvents = ctrl.filteredEvents,
                        len = filteredEvents ? filteredEvents.length : 0,
                        startTime = ctrl.range.startTime,
                        endTime = ctrl.range.endTime,
                        timeZoneOffset = -new Date().getTimezoneOffset(),
                        utcStartTime = new Date(startTime.getTime() + timeZoneOffset * 60 * 1000),
                        utcEndTime = new Date(endTime.getTime() + timeZoneOffset * 60 * 1000),
                        rows = scope.rows,
                        allDayEvents = scope.allDayEvents,
                        oneHour = 3600 * 1000,
                        eps = 0.016,
                        eventSet,
                        normalEventInRange = false;
                    for (var i = 0; i < len; i += 1) {
                        var event = filteredEvents[i];
                        var eventStartTime = new Date(event.startTime);
                        var eventEndTime = new Date(event.endTime);

                        if (event.allDay) {
                            if (eventEndTime <= utcStartTime || eventStartTime >= utcEndTime) {
                                continue;
                            } else {
                                allDayEvents.push({
                                    event: event
                                });
                            }
                        } else {
                            if (eventEndTime <= startTime || eventStartTime >= endTime) {
                                continue;
                            } else {
                                normalEventInRange = true;
                            }

                            var timeDifferenceStart;
                            if (eventStartTime <= startTime) {
                                timeDifferenceStart = 0;
                            } else {
                                timeDifferenceStart = (eventStartTime - startTime) / oneHour;
                            }

                            var timeDifferenceEnd;
                            if (eventEndTime >= endTime) {
                                timeDifferenceEnd = (endTime - startTime) / oneHour;
                            } else {
                                timeDifferenceEnd = (eventEndTime - startTime) / oneHour;
                            }

                            var startIndex = Math.floor(timeDifferenceStart);
                            var endIndex = Math.ceil(timeDifferenceEnd - eps);

                            var displayEvent = {
                                event: event,
                                startIndex: startIndex,
                                endIndex: endIndex
                            };
                            eventSet = rows[startIndex].events;
                            if (eventSet) {
                                eventSet.push(displayEvent);
                            } else {
                                eventSet = [];
                                eventSet.push(displayEvent);
                                rows[startIndex].events = eventSet;
                            }
                        }
                    }

                    if (normalEventInRange) {
                        var orderedEvents = [];
                        for (var hour = 0; hour < 24; hour += 1) {
                            if (rows[hour].events) {
                                orderedEvents = orderedEvents.concat(rows[hour].events);
                            }
                        }
                        if (orderedEvents.length > 0) {
                            ctrl.placeEvents(orderedEvents);
                        }
                    }

                    $timeout(function () {
                        updateScrollGutter();
                    });
                };

                ctrl._refreshView = function () {
                    var startingDate = ctrl.range.startTime;

                    scope.rows = createDateObjects(startingDate);
                    scope.allDayEvents = [];
                    scope.dates = [startingDate];
                    scope.$parent.$parent.$parent.titleDate = dateFilter(startingDate, ctrl.formatDayTitle);
                };

                ctrl._getRange = function getRange(currentDate) {
                    var year = currentDate.getFullYear(),
                        month = currentDate.getMonth(),
                        date = currentDate.getDate(),
                        startTime = new Date(year, month, date),
                        endTime = new Date(year, month, date + 1);

                    return {
                        startTime: startTime,
                        endTime: endTime
                    };
                };

                ctrl.refreshView();
            }
        };
    }]);
