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
        '$ionicModal',
        '$firebaseObject',
        'userService',
        '$state',
        '$ionicActionSheet',
        function ($scope, $attrs, $parse, $interpolate, $log, dateFilter, calendar2Config, $timeout, $firebaseArray, $ionicHistory, dragulaService, $compile, $filter, $q, $ionicModal, $firebaseObject, userService, $state, $ionicActionSheet) {
        'use strict';

        $scope.user = userService.getUser();

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

        // Get the event data from firebase as an array
        var ref = firebase.database().ref();
        var eventsRef = ref.child('events').orderByChild('date');
        var usersRef = $firebaseArray(ref.child('users'));
        $scope.calEvents = $firebaseArray(eventsRef);
        
        $scope.calEvents.$loaded(function(data){
            if($ionicHistory.backView.stateName === "app.events"){// filtering out events that don't need volunteers for volunteer signup view
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
            
            /*jshint loopfunc: true */
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
                            title = ' Cleanup';
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
                            };
                            if(this.volunteers){// This event has volunteers
                                segmentObj.volunteersCount = Object.keys(this.volunteers).length;
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
                segmentStart = moment(event[newObj.type + '_' + 'start']),
                segmentEnd = moment(event[newObj.type + '_' + 'end']);
            // Iterate over volunteers and match the hours they volunteered
            // to the correct event segment
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
                    var previousSegment = $scope.eventSource[$scope.eventSource.length - 1];//the previous segment added
                    if($scope.eventSource.length > 0 && event.$id === $scope.eventId && newObj.type !== 'setup'){ // Is either event or cleanup segment of the same event
                        var setupSegment = $filter('filter')($scope.eventSource, {id: newObj.id, type: 'setup'});
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
                        for (var x = 0; x < volunteerDuration; x++) {
                            volunteer.hours.push(moment(volunteerStart._d).add((x + hoursToAdd), 'hours')); 
                        }
                    } else {
                        for (var z = 0; z < volunteerDuration; z++) {
                            volunteer.hours.push(moment(volunteerStart._d).add(z , 'hours')); 
                        }
                    }
                    volunteer.id = value.id;
                    volunteer.event = event.$id;
                    volunteer.fbKey = key;
                }
                volunteerArr.push(volunteer);
            });
            
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
                    $scope.arrayify(event, $scope.eventSource[$scope.eventSource.length - (iterations + 1)]);
                }
            } 
        };

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
                        console.log(error);
                    });
                } else if( i >= 0){
                    i--;
                    getVolunteersFromFB();
                }
                if(i < 0) {
                    $state.go('app.calendar.volunteers', {thisHoursVolunteers: $scope.thisHoursVolunteers, thisEvent: $scope.thisEvent});
                }
            }
            getVolunteersFromFB();
        };

        $scope.setBorderStyle = function(color){
            if(color === 'primaryGreen'){
                return {'border-radius':'5px 0 0 0'};
            } else if(color === 'primaryRed'){
                return {'border-radius':'0 0 0 5px'};
            } else {
                return {'border-radius':'0'};
            }
        };

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

        /* jshint shadow:true */
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
        };

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
        };

        dragulaService.options($scope, '"bag"', {
            moves: function (el, container, handle) {
                return handle.className === 'drag-element';
            }
        });

        $scope.$on('bag.cloned', function(e, el){
            el.attr('offset-top', 'top');
            el.attr('drag-watch', '');
            $scope.targetEl = angular.element(document.getElementsByClassName('gu-transit')[0]);
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
            var filteredEvents = [];
            var filter = moment(filterBy, 'DD-MM-YYYY');
            for (var i = array.length - 1; i >= 0; i--) {
                var checkDate = moment(array[i][prop], 'DD-MM-YYYY');
                if(checkDate.isSame(filter)){
                    filteredEvents.push(array[i]);
                }
            }
            return filteredEvents;
        };

        $scope.$on('bag.drag', function(el, source){
                var eventSource = $scope.filterEventsByDate(el.currentScope.eventSource, $scope.$parent.$parent.currentDate, 'startTime'),
                latestFinish;
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
                if(value.id === $scope.user.$id){
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
        };

        $scope.$on('bag.drop', function(el, target, source){
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
                    $scope.event = {};
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
                    $scope.selectedHour.el.firstElementChild.style.display = "inline-block";
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
                $scope.selectedHour.hashKey = $event.currentTarget.$$hashKey;
            }
        };
        
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
                self._onDataLoaded();
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
                    var overlapNumber = event.position + 1;
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
            templateUrl: 'rcalendar/calendar.html',
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
            templateUrl: 'rcalendar/month.html',
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
                    /* jshint shadow:true */
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
                    /* jshint shadow:true */
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
            templateUrl: 'rcalendar/week.html',
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
                    /* jshint shadow:true */
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
            templateUrl: 'rcalendar/day.html',
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
// angular.module("templates/rcalendar/calendar.html", []).run(["$templateCache", function($templateCache) {
//   $templateCache.put("templates/rcalendar/calendar.html",
//     "<div ng-switch=\"calendarMode\">\n" +
//     "    <div class=\"row calendar-navbar\">\n" +
//     "        <div class=\"nav-left col-xs-2\">\n" +
//     "            <button type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"move(-1)\"><i\n" +
//     "                    class=\"glyphicon glyphicon-chevron-left\"></i></button>\n" +
//     "        </div>\n" +
//     "        <div class=\"calendar-header col-xs-8\"><strong>{{title}}</strong></div>\n" +
//     "        <div class=\"nav-right col-xs-2\">\n" +
//     "            <button type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"move(1)\"><i\n" +
//     "                    class=\"glyphicon glyphicon-chevron-right\"></i></button>\n" +
//     "        </div>\n" +
//     "    </div>\n" +
//     "    <dayview2 ng-switch-when=\"day\"></dayview2>\n" +
//     "    <monthview2 ng-switch-when=\"month\"></monthview2>\n" +
//     "    <weekview2 ng-switch-when=\"week\"></weekview2>\n" +
//     "</div>");
// }]);

// angular.module("templates/rcalendar/day.html", []).run(["$templateCache", function($templateCache) {
//   $templateCache.put("templates/rcalendar/day.html",
//     "<div>\n" +
//     "    <div class=\"dayview-allday-table\">\n" +
//     "        <div class=\"dayview-allday-label\">\n" +
//     "            all day\n" +
//     "        </div>\n" +
//     "        <div class=\"dayview-allday-content-wrapper\">\n" +
//     "            <table class=\"table table-bordered\" style=\"height: 100%; margin-bottom: 0px\">\n" +
//     "                <tbody>\n" +
//     "                <tr>\n" +
//     "                    <td class=\"calendar-cell\" ng-class=\"{'calendar-event-wrap':allDayEvents}\">\n" +
//     "                        <div ng-repeat=\"displayEvent in allDayEvents\" class=\"calendar-event\"\n" +
//     "                             ng-click=\"eventSelected({event:displayEvent.event})\"\n" +
//     "                             ng-style=\"{top: 25*$index+'px',width: '100%',height:'25px'}\">\n" +
//     "                            <div class=\"calendar-event-inner\">{{displayEvent.event.title}}</div>\n" +
//     "                        </div>\n" +
//     "                    </td>\n" +
//     "                    <td ng-if=\"allDayEventGutterWidth>0\" ng-style=\"{width:allDayEventGutterWidth+'px'}\"></td>\n" +
//     "                </tr>\n" +
//     "                </tbody>\n" +
//     "            </table>\n" +
//     "        </div>\n" +
//     "    </div>\n" +
//     "    <div class=\"scrollable\" style=\"height: 400px\">\n" +
//     "        <table class=\"table table-bordered table-fixed\">\n" +
//     "            <tbody>\n" +
//     "            <tr ng-repeat=\"tm in rows track by $index\">\n" +
//     "                <td class=\"calendar-hour-column text-center\">\n" +
//     "                    {{$index<12?($index === 0?12:$index)+'am':($index === 12?$index:$index-12)+'pm'}}\n" +
//     "                </td>\n" +
//     "                <td class=\"calendar-cell\">\n" +
//     "                    <div ng-class=\"{'calendar-event-wrap': tm.events}\" ng-if=\"tm.events\">\n" +
//     "                        <div ng-repeat=\"displayEvent in tm.events\" class=\"calendar-event\"\n" +
//     "                             ng-click=\"eventSelected({event:displayEvent.event})\"\n" +
//     "                             ng-style=\"{left: 100/displayEvent.overlapNumber*displayEvent.position+'%', width: 100/displayEvent.overlapNumber+'%', height: 37*(displayEvent.endIndex-displayEvent.startIndex)+'px'}\">\n" +
//     "                            <div class=\"calendar-event-inner\">{{displayEvent.event.title}}</div>\n" +
//     "                        </div>\n" +
//     "                    </div>\n" +
//     "                </td>\n" +
//     "            </tr>\n" +
//     "            </tbody>\n" +
//     "        </table>\n" +
//     "    </div>\n" +
//     "</div>");
// }]);

// angular.module("templates/rcalendar/month.html", []).run(["$templateCache", function($templateCache) {
//   $templateCache.put("templates/rcalendar/month.html",
//     "<div>\n" +
//     "    <table class=\"table table-bordered monthview-datetable monthview-datetable\">\n" +
//     "        <thead>\n" +
//     "        <tr>\n" +
//     "            <th ng-show=\"showWeeks\" class=\"calendar-week-column text-center\">#</th>\n" +
//     "            <th ng-repeat=\"label in labels track by $index\" class=\"text-center\">\n" +
//     "                <small>{{label}}</small>\n" +
//     "            </th>\n" +
//     "        </tr>\n" +
//     "        </thead>\n" +
//     "        <tbody>\n" +
//     "        <tr ng-repeat=\"row in rows track by $index\">\n" +
//     "            <td ng-show=\"showWeeks\" class=\"calendar-week-column text-center\">\n" +
//     "                <small><em>{{ weekNumbers[$index] }}</em></small>\n" +
//     "            </td>\n" +
//     "            <td ng-repeat=\"dt in row track by dt.date\" class=\"monthview-dateCell\" ng-click=\"select(dt.date)\"\n" +
//     "                ng-class=\"{'text-center':true, 'monthview-current': dt.current&&!dt.selected&&!dt.hasEvent,'monthview-secondary-with-event': dt.secondary&&dt.hasEvent, 'monthview-primary-with-event':!dt.secondary&&dt.hasEvent&&!dt.selected, 'monthview-selected': dt.selected}\">\n" +
//     "                <div ng-class=\"{'text-muted':dt.secondary}\">\n" +
//     "                    {{dt.label}}\n" +
//     "                </div>\n" +
//     "            </td>\n" +
//     "        </tr>\n" +
//     "        </tbody>\n" +
//     "    </table>\n" +
//     "    <div ng-if=\"showEventDetail\" class=\"event-detail-container\">\n" +
//     "        <div class=\"scrollable\" style=\"height: 200px\">\n" +
//     "            <table class=\"table table-bordered table-striped table-fixed\">\n" +
//     "                <tr ng-repeat=\"event in selectedDate.events\" ng-if=\"selectedDate.events\">\n" +
//     "                    <td ng-if=\"!event.allDay\" class=\"monthview-eventdetail-timecolumn\">{{event.startTime|date: 'HH:mm'}}\n" +
//     "                        -\n" +
//     "                        {{event.endTime|date: 'HH:mm'}}\n" +
//     "                    </td>\n" +
//     "                    <td ng-if=\"event.allDay\" class=\"monthview-eventdetail-timecolumn\">All day</td>\n" +
//     "                    <td class=\"event-detail\" ng-click=\"eventSelected({event:event})\">{{event.title}}</td>\n" +
//     "                </tr>\n" +
//     "                <tr ng-if=\"!selectedDate.events\"><td class=\"no-event-label\">No Events</td></tr>\n" +
//     "            </table>\n" +
//     "        </div>\n" +
//     "    </div>\n" +
//     "</div>");
// }]);

// angular.module("templates/rcalendar/week.html", []).run(["$templateCache", function($templateCache) {
//   $templateCache.put("templates/rcalendar/week.html",
//     "<div>\n" +
//     "    <table class=\"table table-bordered table-fixed weekview-header\">\n" +
//     "        <thead>\n" +
//     "        <tr>\n" +
//     "            <th class=\"calendar-hour-column\"></th>\n" +
//     "            <th ng-repeat=\"dt in dates\" class=\"text-center weekview-header-label\">{{dt.date| date: 'EEE d'}}</span></th>\n" +
//     "            <th ng-if=\"gutterWidth>0\" ng-style=\"{width: gutterWidth+'px'}\"></th>\n" +
//     "        </tr>\n" +
//     "        </thead>\n" +
//     "    </table>\n" +
//     "    <div class=\"weekview-allday-table\">\n" +
//     "        <div class=\"weekview-allday-label\">\n" +
//     "            all day\n" +
//     "        </div>\n" +
//     "        <div class=\"weekview-allday-content-wrapper\">\n" +
//     "            <table class=\"table table-bordered table-fixed\" style=\"height: 100%; margin-bottom: 0px\">\n" +
//     "                <tbody>\n" +
//     "                <tr>\n" +
//     "                    <td ng-repeat=\"day in dates track by day.date\" class=\"calendar-cell\">\n" +
//     "                        <div ng-class=\"{'calendar-event-wrap': day.events}\" ng-if=\"day.events\">\n" +
//     "                            <div ng-repeat=\"displayEvent in day.events\" class=\"calendar-event\"\n" +
//     "                                 ng-click=\"eventSelected({event:displayEvent.event})\"\n" +
//     "                                 ng-style=\"{top: 25*displayEvent.position+'px', width: 100*(displayEvent.endIndex-displayEvent.startIndex)+'%', height: '25px'}\">\n" +
//     "                                <div class=\"calendar-event-inner\">{{displayEvent.event.title}}</div>\n" +
//     "                            </div>\n" +
//     "                        </div>\n" +
//     "                    </td>\n" +
//     "                    <td ng-if=\"allDayEventGutterWidth>0\" ng-style=\"{width: allDayEventGutterWidth+'px'}\"></td>\n" +
//     "                </tr>\n" +
//     "                </tbody>\n" +
//     "            </table>\n" +
//     "        </div>\n" +
//     "    </div>\n" +
//     "    <div class=\"scrollable\" style=\"height: 400px\">\n" +
//     "        <table class=\"table table-bordered table-fixed\">\n" +
//     "            <tbody>\n" +
//     "            <tr ng-repeat=\"row in rows track by $index\">\n" +
//     "                <td class=\"calendar-hour-column text-center\">\n" +
//     "                    {{$index<12?($index === 0?12:$index)+'am':($index === 12?$index:$index-12)+'pm'}}\n" +
//     "                </td>\n" +
//     "                <td ng-repeat=\"tm in row track by tm.time\" class=\"calendar-cell\">\n" +
//     "                    <div ng-class=\"{'calendar-event-wrap': tm.events}\" ng-if=\"tm.events\">\n" +
//     "                        <div ng-repeat=\"displayEvent in tm.events\" class=\"calendar-event\"\n" +
//     "                             ng-click=\"eventSelected({event:displayEvent.event})\"\n" +
//     "                             ng-style=\"{left: 100/displayEvent.overlapNumber*displayEvent.position+'%', width: 100/displayEvent.overlapNumber+'%', height: 37*(displayEvent.endIndex-displayEvent.startIndex)+'px'}\">\n" +
//     "                            <div class=\"calendar-event-inner\">{{displayEvent.event.title}}</div>\n" +
//     "                        </div>\n" +
//     "                    </div>\n" +
//     "                </td>\n" +
//     "                <td ng-if=\"normalGutterWidth>0\" ng-style=\"{width: normalGutterWidth+'px'}\"></td>\n" +
//     "            </tr>\n" +
//     "            </tbody>\n" +
//     "        </table>\n" +
//     "    </div>\n" +
//     "</div>");
// }]);

// Future work - Filter the current user out of contact search results
Pta.directive('contactpicker', [
    '$q',
    '$filter',
    '$timeout',
    '$window',
    '$http',
    '$cordovaContacts',
    '$firebaseArray',
    'userService',
    'userFilter',
    function ($q, $filter, $timeout, $window, $http, $cordovaContacts, $firebaseArray, userService, userFilter) {
        'use strict';
        return {
            restrict: 'EAC',
            replace: true,
            transclude: true,
            templateUrl: 'contactpicker.html',
            scope: {
                name:                   '@?',
                value:                  '=model',
                disabled:               '=?disable',
                required:               '=?require',
                multiple:               '=?multi',
                placeholder:            '@?',
                valueAttr:              '@',
                labelAttr:              '@?',
                groupAttr:              '@?',
                options:                '=?',
                create:                 '&?',
                rtl:                    '=?',
                api:                    '=?',
                change:                 '&?',
                removeButton:           '=?',
                softDelete:             '=?',
                viewItemTemplate:       '=?',
                dropdownItemTemplate:   '=?',
                dropdownCreateTemplate: '=?',
                dropdownGroupTemplate:  '=?'
            },
            link: function (scope, element, attrs, controller, transclude) {
                transclude(scope, function (clone, scope) {
                    var input        = angular.element(element[0].querySelector('.selector-input input')),
                        dropdown     = angular.element(element[0].querySelector('.selector-dropdown')),
                        initDeferred = $q.defer(),
                        defaults     = {
                            api:                    {},
                            search:                 '',
                            selectedValues:         [],
                            valueAttr:              null,
                            labelAttr:              'label',
                            groupAttr:              'group',
                            options:                [],
                            removeButton:           true,
                            viewItemTemplate:       'templates/item-default.html',
                            dropdownItemTemplate:   'templates/item-default.html',
                            dropdownCreateTemplate: 'templates/item-create.html',
                            dropdownGroupTemplate:  'templates/group-default.html'
                        };
                    var KEYS = {
                        backspace: 8,  
                        // up: 38, 
                        // down: 40, 
                        // left: 37, 
                        // right: 39, 
                        // escape: 27, 
                        // enter: 13, 
                        // delete: 46, 
                        // shift: 16, 
                        // leftCmd: 91, 
                        // rightCmd: 93, 
                        // ctrl: 17, 
                        // alt: 18, 
                        // tab: 9 
                    };

                    scope.keydown = function (e) {
                        switch (e.keyCode) {
                            // case KEYS.up:
                            //     if (!scope.isOpen) break;
                            //     scope.decrementHighlighted();
                            //     e.preventDefault();
                            //     break;
                            // case KEYS.down:
                            //     if (!scope.isOpen) scope.open();
                            //     else scope.incrementHighlighted();
                            //     e.preventDefault();
                            //     break;
                            // case KEYS.escape:
                            //     scope.highlight(0);
                            //     scope.close();
                            //     break;
                            // case KEYS.enter:
                            //     if (scope.isOpen) {
                            //         if (attrs.create && scope.search && scope.highlighted == -1)
                            //             scope.createOption(e.target.value);
                            //         else
                            //             if (scope.filteredOptions.length)
                            //                 scope.set();
                            //         e.preventDefault();
                            //     }
                            //     break;
                            case KEYS.backspace:
                                if (!input.val()) {
                                    var search = (scope.selectedValues.slice(-1)[0] || {})[scope.labelAttr] || '';
                                    scope.unset();
                                    scope.open();
                                    if (scope.softDelete) {
                                        scope.search = search;
                                        if (scope.multiple) e.preventDefault();
                                    }
                                }
                                break;
                            // case KEYS.left:
                            // case KEYS.right:
                            // case KEYS.shift:
                            // case KEYS.ctrl:
                            // case KEYS.alt:
                            // case KEYS.tab:
                            // case KEYS.leftCmd:
                            // case KEYS.rightCmd:
                            //     break;
                            default:
                                if (!scope.multiple && scope.hasValue()) {
                                    e.preventDefault();
                                } else {
                                    scope.open();
                                    // scope.highlight(0);
                                }
                                break;
                        }
                    };

                    scope.searchContacts = function(){
                        // Disabled phone contacts search in favor of only searching registered users 
                        // at the parent's associated school
                        // if(user.isAdmin && !scope.searchSchool){
                        //     $cordovaContacts.find({
                        //         filter: document.getElementById('contactsInput').value,
                        //         multiple: true,
                        //         fields: ['displayName', 'name']
                        //     })
                        //     .then(function(contactsFound){
                        //         var nameRegEx = /^([a-z0-9_\.-]+)@/g;
                        //         angular.forEach(contactsFound, function(value, key){
                        //             if(value.emails && value.displayName && !nameRegEx.test(value.displayName)){
                        //                 var contact = {};
                        //                 contact.email = value.emails[0].value
                        //                 contact.id = parseInt(value.id);
                        //                 contact.label = value.displayName + " " + "<" + value.emails[0].value + ">"
                        //                 scope.options.push(contact);
                        //             }
                        //         });
                        //     });
                        // } else {
                        var user = userService.getUser();
                        var users = firebase.database().ref('users');
                        var school = $firebaseArray(users.orderByChild('school').equalTo(user.school));
                        school.$loaded()
                        .then(function(schoolParents){
                            scope.options = userFilter(schoolParents, scope.search);
                        });
                    };

                    function getStyles(element) {
                        return !(element instanceof HTMLElement) ? {} :
                            element.ownerDocument && element.ownerDocument.defaultView.opener ? element.ownerDocument.defaultView.getComputedStyle(element)
                                : window.getComputedStyle(element);
                    }
                    
                    // Default attributes
                    if (!angular.isDefined(scope.value))
                        scope.value = scope.multiple ? [] : '';
                    angular.forEach(defaults, function (value, key) {
                        if (!angular.isDefined(scope[key])) scope[key] = value;
                    });
                    angular.forEach(['name', 'valueAttr', 'labelAttr'], function (attr) {
                        if (!attrs[attr]) attrs[attr] = scope[attr];
                    });
                    
                    // Options' utilities
                    scope.optionValue = function (option) {
                        return scope.valueAttr === null ? option : option[scope.valueAttr];
                    };
                    scope.optionEquals = function (option, value) {
                        return angular.equals(scope.optionValue(option), angular.isDefined(value) ? value : scope.value);
                    };
                    
                    // Value utilities
                    scope.setValue = function (value) {
                        var emailRegex = /<(.*?)\>/g;
                        var nameValue = emailRegex.exec(value);
                        if (!scope.multiple) scope.value = scope.valueAttr === null ? (nameValue || {}) : (nameValue || {})[scope.valueAttr];
                        else scope.value = scope.valueAttr === null ? (nameValue || []) : (nameValue || []).map(function (option) { return option[scope.valueAttr]; });
                    };
                    scope.hasValue = function () {
                        return scope.multiple ? (scope.value || []).length > 0 : (scope.valueAttr === null ? !angular.equals({}, scope.value) : !!scope.value);
                    };
                   
                    scope.fillWithHtml = function () {
                        scope.options = [];
                        angular.forEach(clone, function (element) {
                            var tagName = (element.tagName || '').toLowerCase();
                            if (tagName == 'option') scope.optionToObject(element);
                            if (tagName == 'optgroup') {
                                angular.forEach(element.querySelectorAll('option'), function (option) {
                                    scope.optionToObject(option, (element.attributes.name || {}).value);
                                });
                            }
                        });
                        scope.updateSelected();
                    };
                    
                    // Initialization
                    scope.initialize = function () {
                        if (!angular.isArray(scope.options) || !scope.options.length)
                            scope.fillWithHtml();
                        if (scope.hasValue()) {
                            if (!scope.multiple) {
                                if (angular.isArray(scope.value)) scope.value = scope.value[0];
                            } else {
                                if (!angular.isArray(scope.value)) scope.value = [scope.value];
                            }
                            scope.updateSelected();
                            scope.filterOptions();
                            scope.updateValue();
                        }
                    };
                    scope.$watch('multiple', function () {
                        $timeout(scope.setInputWidth);
                        initDeferred.promise.then(scope.initialize, scope.initialize);
                    });
                    
                    // Dropdown utilities
                    scope.dropdownPosition = function () {
                        var label       = input.parent()[0],
                            styles      = getStyles(label),
                            marginTop   = parseFloat(styles.marginTop || 0),
                            marginLeft  = parseFloat(styles.marginLeft || 0);
                        
                        dropdown.css({
                            top:   (label.offsetTop + label.offsetHeight + marginTop) + 'px',
                            left:  (label.offsetLeft + marginLeft) + 'px',
                            width: label.offsetWidth + 'px'
                        });
                    };
                    scope.open = function () {
                        scope.isOpen = true;
                        scope.dropdownPosition();
                    };
                    scope.close = function () {
                        scope.isOpen = false;
                        scope.resetInput();
                    };

                    //Watches for the correct time to hide or show the new chat room creat button
                    scope.$watchGroup(['isOpen', 'selectedValues'], function(newValues){
                        scope.$emit('chatSubmitChanged', newValues);
                    });

                    scope.createOption = function (value) {
                        var option = {};
                        if (angular.isFunction(scope.create)) {
                            option = scope.create({ input: value });
                        } else {
                            option[scope.labelAttr] = value;
                            option[scope.valueAttr || 'value'] = value;
                        }
                        scope.options.push(option);
                        scope.set(option);
                    };
                    scope.set = function (option) {
                        var nameRegEx = /[A-Z][ a-zA-Z]*/g;
                        if (!angular.isDefined(option))
                            option = scope.filteredOptions[this.$index];
                        if (!scope.multiple) scope.selectedValues = [option];
                        else {
                            if (scope.selectedValues.indexOf(option) < 0)
                                option.label = nameRegEx.exec(option.label);
                                scope.selectedValues.push(option);
                        }
                        if (!scope.multiple) scope.close();
                        scope.resetInput();
                    };
                    scope.unset = function (index) {
                        if (!scope.multiple) scope.selectedValues = [];
                        else scope.selectedValues.splice(angular.isDefined(index) ? index : scope.selectedValues.length - 1, 1);
                        scope.resetInput();
                    };
                    
                    // Filtered options
                    scope.inOptions = function (options, value) {
                        return options.indexOf(value) >= 0;
                    };
                    scope.filterOptions = function () {
                        scope.filteredOptions = scope.options;
                        if (scope.multiple)
                            scope.filteredOptions = scope.filteredOptions.filter(function (option) {
                                var selectedValues = angular.isArray(scope.selectedValues) ? scope.selectedValues : [scope.selectedValues];
                                return !scope.inOptions(selectedValues, option);
                            });
                    };
                    
                    // Input width utilities
                    scope.measureWidth = function () {
                        var width,
                            styles = getStyles(input[0]),
                            shadow = angular.element('<span class="selector-shadow"></span>');
                        shadow.text(input.val() || (!scope.hasValue() ? scope.placeholder : '') || '');
                        angular.element(document.body).append(shadow);
                        angular.forEach(['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent'], function (style) {
                            shadow.css(style, styles[style]);
                        });
                        width = shadow[0].offsetWidth;
                        shadow.remove();
                        return width;
                    };
                    scope.setInputWidth = function () {
                        var width = scope.measureWidth() + 1;
                        input.css('width', width + 'px');
                    };
                    scope.resetInput = function () {
                        input.val('');
                        scope.search = '';
                        scope.setInputWidth();
                    };
                    
                    scope.$watch('[search, options, value]', function () {
                        // Remove selected items
                        scope.filterOptions();
                        $timeout(function () {
                            // set width
                            scope.setInputWidth();
                            // Repositionate dropdown
                            if (scope.isOpen) scope.dropdownPosition();
                        });
                    }, true);
                    
                    // Update value
                    scope.updateValue = function (origin) {
                        if (!angular.isDefined(origin)) origin = scope.selectedValues;
                        scope.setValue(!scope.multiple ? origin[0] : origin);
                    };
                    scope.$watch('selectedValues', function (newValue, oldValue) {
                        if (angular.equals(newValue, oldValue)) return;
                        scope.updateValue();
                        if (angular.isFunction(scope.change))
                            scope.change(scope.multiple ? { newValue: newValue, oldValue: oldValue }
                                : { newValue: newValue[0], oldValue: oldValue[0] });
                    }, true);
                    scope.$watchCollection('options', function (newValue, oldValue) {
                        if (angular.equals(newValue, oldValue)) return;
                        scope.updateSelected();
                    });
                    
                    // Update selected values
                    scope.updateSelected = function () {
                        if (!scope.multiple) scope.selectedValues = (scope.options || []).filter(function (option) { return scope.optionEquals(option); }).slice(0, 1);
                        // This was causing previously selected contact to be removed from scope.selectedValues when a new search was started to add multiple
                        // contacts after the seach location was switched from device contacts to Firebase users.
                        // else
                            // scope.selectedValues = (scope.value || []).map(function (value) {
                            //     return $filter('filter')(scope.options, function (option) {
                            //         return scope.optionEquals(option, value);
                            //     })[0];
                            // }).filter(function (value) { return angular.isDefined(value); });
                    };
                    scope.$watch('value', function (newValue, oldValue) {
                        if (angular.equals(newValue, oldValue)) return;
                        if (scope.options.length > 0) scope.updateSelected();
                        scope.filterOptions();
                        scope.updateValue();
                    }, true);
                    
                    // DOM event listeners
                    input = angular.element(element[0].querySelector('.selector-input input'))
                        .on('focus', function () {
                            $timeout(function () {
                                scope.$apply(scope.open);
                            });
                        })
                        .on('blur', function () {
                            scope.$apply(scope.close);
                        })
                        .on('keydown', function (e) {
                            scope.$apply(function () {
                                scope.keydown(e);
                            });
                        })
                        .on('input', function () {
                            scope.setInputWidth();
                        });
                    angular.element($window)
                        .on('resize', function () {
                            scope.dropdownPosition();
                        });
                    
                    // Expose APIs
                    angular.forEach(['open', 'close', 'fetch'], function (api) {
                        scope.api[api] = scope[api];
                    });
                    scope.api.focus = function () {
                        input[0].focus();
                    };
                    scope.api.set = function (value) {
                        var search = (scope.filteredOptions || []).filter(function (option) { return scope.optionEquals(option, value); });
                        
                        angular.forEach(search, function (option) {
                            scope.set(option);
                        });
                    };
                    scope.api.unset = function (value) {
                        var values  = !value ? scope.selectedValues : (scope.selectedValues || []).filter(function (option) { return scope.optionEquals(option, value); }),
                            indexes =
                                scope.selectedValues.map(function (option, index) {
                                    return scope.inOptions(values, option) ? index : -1;
                                }).filter(function (index) { return index >= 0; });
                        
                        angular.forEach(indexes, function (index, i) {
                            scope.unset(index - i);
                        });
                    };
                });
            }
        };
}]);
angular.module('templates/contactpicker.html', []).run(['$templateCache', function ($templateCache) {
    $templateCache.put('templates/contactpicker.html',
        '<div class="selector-container" ng-attr-dir="{{rtl ? \'rtl\' : \'ltr\'}}" ' +
            'ng-class="{open: isOpen, empty: !filteredOptions.length && (!create || !search), multiple: multiple, \'hasvalue\': hasValue(), rtl: rtl, ' +
                'loading: loading, \'removebutton\': removeButton, disabled: disabled}">' +
            '<select name="{{name}}" ng-hide="true" ' +
                'ng-model="selectedValues" multiple ng-options="option as option[labelAttr] for option in selectedValues" ng-hide="true"></select>' +
            '<label class="selector-input">' +
                '<ul class="selector-values">' +
                    '<li ng-repeat="(index, option) in selectedValues track by index">' +
                        '<div ng-include="viewItemTemplate"></div>' +
                        '<div ng-if="multiple" class="selector-helper" ng-click="!disabled && unset(index)">' +
                            '<span class="selector-icon"></span>' +
                        '</div>' +
                    '</li>' +
                '</ul>' +
                '<input ng-keyup="searchContacts()" id="contactsInput" ng-model="search" placeholder="{{!hasValue() ? placeholder : \'\'}}" ng-disabled="disabled" ng-required="required && !hasValue()">' +
                '<div ng-if="!multiple || loading" class="selector-helper selector-global-helper" ng-click="!disabled && removeButton && unset()">' +
                    '<span class="selector-icon"></span>' +
                '</div>' +
            '</label>' +
            '<ul class="selector-dropdown" ng-show="filteredOptions.length > 0 || (create && search)">' +
                '<li class="selector-option create" ng-if="create && search" ' +
                    'ng-include="dropdownCreateTemplate" ng-click="createOption(search)"></li>' +
                '<li ng-repeat-start="(index, option) in filteredOptions track by index" class="selector-optgroup" ' +
                    'ng-include="dropdownGroupTemplate" ng-show="option[groupAttr] && index == 0 || filteredOptions[index-1][groupAttr] != option[groupAttr]"></li>' +
                '<li ng-repeat-end ng-class="{grouped: option[groupAttr]}" class="selector-option" ' +
                    'ng-include="dropdownItemTemplate" ng-click="set()"></li>' +
            '</ul>' +
        '</div>'
    );
    $templateCache.put('templates/item-create.html', 'Add <i ng-bind="search"></i>');
    $templateCache.put('templates/item-default.html', '<span ng-bind="option[labelAttr] || option"></span>');
    $templateCache.put('templates/group-default.html', '<span ng-bind="option[groupAttr]"></span>');
}]);
    

Pta.directive('insertSignup', [
  '$timeout',
  '$compile',
  '$templateRequest',
  function($timeout, $compile, $templateRequest){
  return {
    restrict: 'A', 
    link: function(scope, element, attrs) {
      if(scope.$last){
        $templateRequest('templates/signup-btn.html')
        .then(function(html){
          var calEvent = angular.element(element);
          var hours = parseInt(calEvent[0].style.height)/40;
          var tableCell = calEvent.parent().parent();
          var tableRow = tableCell.parent();
          var template;
          function prependTpl(cell, tpl){
            cell.prepend(tpl);
            $compile(tpl)(scope);
          }
          $timeout(function(){
            if(hours > 1){
              for (var i = hours; i > 0; i--) {
                template = angular.element(html);
                if(i !== hours){
                  tableCell = tableCell.parent().next().children().eq(tableCell.parent().next().children().length - 1);
                }
                prependTpl(tableCell, template);
              }
            } else if(hours === 1){
              template = angular.element(html);
              prependTpl(tableCell, template);
            }
          }, 500);
        });
      }
    }
  };
}]);
Pta.directive('dragWatch', ['$timeout', function ($timeout) {

    return {

        link: function (scope, element, attrs) {

            function parseTime(timeStr, dt) {
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
            
            scope.$watch(function () {
                return parseInt(element.css(attrs.offsetTop));
            },  styleChangedCallBack,
            true);
            
            var runningCount = 0;
            var initDrag = true;

            function styleChangedCallBack(newValue, oldValue) {
                if(initDrag){
                    scope.dateTime = moment(parseTime(scope.displayEnd, scope.latestFinish._d)).add({minutes:60});
                    scope.displayEnd = scope.dateTime.format('h:mm a');
                    initDrag = false;
                }

                if (newValue !== oldValue) {
                    var offsetChange = function(){
                        var actualPixels = newValue - oldValue,
                            obj = {};
                        if(actualPixels > 0){
                            runningCount = runningCount + actualPixels;// Dragging down, increasing time
                        } else {
                            runningCount = runningCount + (actualPixels * -1);// Dragging up, decreasing time
                        }
                        
                        if(runningCount >= 40){
                            runningCount = runningCount - 40;
                            obj.minutes = 60;
                            return obj; //rounded Y-axis position change in pixels
                        }
                    };
                    // dragged down = time increase and signup time is still before latest finish time
                    if(newValue > oldValue && moment(scope.latestFinish._i).diff(scope.dateTime) > 0 ){
                        scope.dateTime.add(offsetChange());
                    }
                    // dragged up = time decrease and signup time is still after latest finish time 
                    else if(newValue < oldValue && scope.dateTime.diff(scope.earliestFinish) > 0){ 
                        scope.dateTime.subtract(offsetChange());
                    }
                    scope.displayEnd = scope.dateTime.format('h:mm a');// Update the displayed time in the drag element
                } 
            }
        }
    };

}]);

Pta.directive('emailBtn', [
  function(){
    return {
      scope: {
        emailTo: '=recipient',
        opening: '@prepend',
        closing: '=append'
      },
      replace: true,
      restrict: 'E',
      template: '<button class="icon ion-email"></button>',
      link: function(scope, elem) { 
         elem.bind('click', function(e) {
           console.log('Hello: ', e);
           cordova.plugins.email.open({
             to: scope.emailTo,
             subject: scope.opening + " " + scope.closing
           });
         }); 
      }
    };
}]);
Pta.filter('formatDate', function(){
  return function(date){
    var now = moment(),
        newMoment = moment(date),
        comparator = now.diff(date);    
    switch(true){
      case (comparator < 3000):
        return "Just now";
      case (comparator < 5400000)://less than 90 minutes ago
        return newMoment.fromNow();
      case (comparator < 604800000):
        return newMoment.format('dd MMM Do h:m a');// less than a week ago
      default: 
        if(newMoment.isSame(now, 'year')){
          return newMoment.format('MMM Do');
        } else {
          return newMoment.format('M/D/YYYY');
        }
    }
  };
});
Pta.factory('userService', function () {
  var service = {
    _user: null,
    setUser: function (user) {
      if (user && !user.error) {
        service._user = user;
        return service.getUser();
      } else {
        return user.error;
      }
    },
    getUser: function () {
      return service._user;
    }
  };
  return service;
});
Pta.controller('LocationCtrl', function($scope){
  $scope.location = {};
})
.service('LocationService', function($q){
  var autocompleteService = new google.maps.places.AutocompleteService();
  var detailsService = new google.maps.places.PlacesService(document.createElement("input"));
  return {
    searchAddress: function(input) {
      var deferred = $q.defer();

      autocompleteService.getPlacePredictions({
        input: input
      }, function(result, status) {
        if(status == google.maps.places.PlacesServiceStatus.OK){
          deferred.resolve(result);
        }else{
          deferred.reject(status);
        }
      });

      return deferred.promise;
    },
    getDetails: function(placeId) {
      var deferred = $q.defer();
      detailsService.getDetails({placeId: placeId}, function(result) {
        deferred.resolve(result);
      });
      return deferred.promise;
    }
  };
})
.directive('locationSuggestion', function($ionicModal, LocationService){
  return {
    restrict: 'A',
    scope: {
      location: '='
    },
    link: function($scope, element){
      $scope.search = {};
      $scope.search.suggestions = [];
      $scope.search.query = "";
      $ionicModal.fromTemplateUrl('location_search.html', {
        scope: $scope,
        focusFirstInput: true
      }).then(function(modal) {
        $scope.locationModal = modal;
      });
      element[0].addEventListener('focus', function(event) {
        $scope.open();
      });
      $scope.$watch('search.query', function(newValue) {
        if (newValue) {
          LocationService.searchAddress(newValue).then(function(result) {
            $scope.search.error = null;
            $scope.search.suggestions = result;
          }, function(status){
            $scope.search.error = "There was an error :( " + status;
          });
        }
        $scope.$on('$destroy', function() {
          $scope.locationModal.remove();
        });
        $scope.open = function() {
          $scope.locationModal.show();
        };
        $scope.close = function() {
          $scope.locationModal.hide();
        };
        $scope.choosePlace = function(place) {
          LocationService.getDetails(place.place_id).then(function(location) {
            $scope.location = location;
            $scope.$emit('selectedLocation', location);
            $scope.close();
          });
        };
      });
    }
  };
});
Pta.factory('$localstorage', ['$window', function ($window) {
  return {
     set: function(key, value) {
       $window.localStorage[key] = value;
     },
     get: function(key, defaultValue) {
       return $window.localStorage[key] || defaultValue;
     },
     setObject: function(key, value) {
       $window.localStorage[key] = JSON.stringify(value);
     },
     getObject: function(key) {
       return JSON.parse($window.localStorage[key] || '{}');
     },
     remove: function (key) {
      localStorage.removeItem(key);
     }
   };
}]);
Pta.factory('Chats', [
    'Rooms',
    '$firebaseArray',
    'userService',
    function (Rooms, $firebaseArray, userService) {

    var selectedRoomId,
        chats,
        user = userService.getUser();
        ref = firebase.database().ref();
    return {
        all: function () {
            return chats;
        },
        get: function (chatId) {
            for (var i = 0; i < chats.length; i++) {
                if (chats[i].id === parseInt(chatId)) {
                    return chats[i];
                }
            }
            return null;
        },
        getSelectedRoomName: function () {
            var selectedRoom;
            if (selectedRoomId && selectedRoomId !== null) {
                return Rooms.get(selectedRoomId);
            } else {
                return null;
            }
        },
        selectRoom: function (roomId) {
            selectedRoomId = roomId;
            chats = $firebaseArray(ref.child('rooms').child(selectedRoomId).child('chats'));
        },
        send: function (sender, message) {
            if (sender && message) {
                var chatMessage = {
                    userId: sender.$id,
                    from: sender.name,
                    message: message,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                chats.$loaded()
                .then(function(){
                    var lastAdded = chats.$getRecord(chats.$keyAt(chats.length - 1));
                    if(lastAdded && lastAdded.userId !== sender.$id){//only add a pic if the previous sender wasn't the same person
                        if(!sender.pic){
                          chatMessage.pic = sender.name.charAt(0);// if no pic use first letter of first name
                        } else {
                          chatMessage.pic = sender.pic;
                        }
                        chats.$add(chatMessage);
                    } else if(!lastAdded){// Or if this is the first chat in a room
                        if(!sender.pic){
                          chatMessage.pic = sender.name.charAt(0);// if no pic use first letter of first name
                        } else {
                          chatMessage.pic = sender.pic;
                        }
                        chats.$add(chatMessage);
                    } else {
                        chats.$add(chatMessage);
                    }
                });
            }
        }
    };
}]);
Pta.factory('userFilter', function(){
  return function(parents, search){
    // Future work - Make parent's searchable by their child's current teacher
    var options,
        parsedSearch = parseInt(search),// Integer of grade OR NaN
        displayableOptions = function(contactsFound){
          var madeDisplayable = [];
          angular.forEach(contactsFound, function(value, key){
              var contact = value;
              contact.label = value.name + " " + "<" + value.email + ">";
              madeDisplayable.push(contact);
          });
          return madeDisplayable;
        };
    if(search){
      if(isNaN(parsedSearch)){
        options = [];
        var properties = ['name', 'email', 'children'];
        angular.forEach(parents, function(parent){
          for (var i = properties.length - 1; i >= 0; i--) {
            //We're not on the 'children' property && this parent has this property set && this parent's name or email was matched && This parent isn't already in options
            if(i < properties.length - 1 && parent[properties[i]] && parent[properties[i]].indexOf(search) >= 0 && options.map(
              function(el){ 
                return el.$id;
              }).indexOf(parent.$id)< 0){
              options.push(parent);
            } else {
              /*jshint loopfunc: true */
              angular.forEach(parent.children, function(value, key){
                if(value.name.indexOf(search) >= 0 && options.map(
                  function(el){
                    return el.$id;
                  }).indexOf(parent.$id) < 0){
                    options.push(parent);
                  }
              });
            }
          }
        });
      } else {
        if(typeof parsedSearch === "number") {
          options = [];
          angular.forEach(parents, function(parent){
            if(parent.children){
              angular.forEach(parent.children, function(child){
                //This parent has a child in the grade level searched && this child's parent isn't already in options
                if(child.grade === parsedSearch && options.map(
                  function(el){
                    return el.$id;
                  }).indexOf(parent.$id) < 0){
                    options.push(parent);
                  }
              });
            }
          });
        }  
      }
      return displayableOptions(options); 
    } else {
      return displayableOptions(parents);
    }
  };
});
Pta.factory('Rooms', [
  '$firebaseArray',
  '$firebaseObject',
  'userService',
  'pushSubscribe',
  function ($firebaseArray, $firebaseObject, userService, pushSubscribe) {
  var ref = firebase.database().ref(),
      user = userService.getUser();
      userRoomsRef = firebase.database().ref('user-rooms').child(user.$id),
      roomsRef = firebase.database().ref('/rooms'),
      // Subscribes the current user to push notifications for all of their user-rooms
      userRoom = new pushSubscribe(userRoomsRef); // jshint ignore:line
  return {
      all: function () {
        return $firebaseArray(userRoomsRef);
      },
      get: function (roomId) {
        return $firebaseObject(userRoomsRef.child(roomId));
      },
      addNewRoom: function(users, roomPath, newRoomId, subject){
        var chatter, firstName, lastName,
        namesArr = [],
        room = {},
        updates = {};

        room.chatters = [];
        users.push(user);
        angular.forEach(users, function(value, key){
          chatter = {};
          chatter.id = value.$id;
          chatter.email = value.email;
          chatter.name = value.name;
          chatter.pic = value.pic;
          if(chatter.id === user.$id){
            room.owner = chatter.id;
          }
          room.chatters.push(chatter);
        });
        if(subject){// The room is tied to some type of event
          room.subject = subject.title;
          updates[roomPath + subject.id + '/' + newRoomId] = room; 
        }
        // if(room.chatters.length > 2 || subject){// Creating a group chat room
        for (var x = room.chatters.length - 1; x >= 0; x--) {
          firstName = room.chatters[x].name.split(' ')[0];
          lastName = room.chatters[x].name.split(' ')[1];
          namesArr.push(firstName + " " + lastName.charAt(0));
        }
        namesArr.reverse();
        for (var i = room.chatters.length - 1; i >= 0; i--) {
          var toBeUpdated = namesArr.splice(i, 1),// Pull the users name from the title whose userRooms we're adding this to
              obj = {},
              roomInstance = angular.extend(obj, room);
          roomInstance.title = namesArr.join(', ');// Create the title
          if(subject){ 
            roomInstance.subject = subject.title;
          }
          updates['/user-rooms/' + room.chatters[i].id + '/' + newRoomId] = roomInstance;// Format the firebase update
          namesArr.splice(i, 0, toBeUpdated[0]);// Put that user's name back in the same place for the next title 
        }
        // } else 
        if(room.chatters.length > 1){// Creating a one-on-one chat room
          updates['/user-rooms/' + room.chatters[0].id + '/' + newRoomId] = room;
          updates['/user-rooms/' + room.chatters[1].id + '/' + newRoomId] = room;
        } else {
          updates['/user-rooms/' + room.chatters[0].id + '/' + newRoomId] = room;
        }
        updates['/rooms/' + newRoomId] = room;
        ref.update(updates);
        return newRoomId;
      } 
  };
}]);
Pta.factory('pushSubscribe', [
  '$firebaseArray',
  function ($firebaseArray) {
  return $firebaseArray.$extend({
    $$added: function(room){
      // Room topic is the $id of the chat room
      FCMPlugin.subscribeToTopic(room.key);
    },
    $$removed: function(room){
      FCMPlugin.unsubscribeFromTopic(room.key);
    }
  });
}]);

// Subscibes or unsubscribes users to push notifications
// as new rooms are added or removed from their user-rooms
// see rooms_factory.js implementation