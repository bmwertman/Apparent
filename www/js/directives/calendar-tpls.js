Pta.constant('calendar2Config', {
        formatDay: 'dd',
        formatDayHeader: 'EEE',
        formatDayTitle: 'MMMM dd, yyyy',
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
        '$rootScope',
        '$scope', 
        '$attrs', 
        '$parse', 
        '$interpolate', 
        '$log', 
        'dateFilter', 
        'calendar2Config', 
        '$timeout', 
        '$localstorage',
        '$ionicModal',
        'LocationService',
        '$ionicPlatform',
        '$state',
        '$ionicLoading',
        'FIREBASE_URL',
        '$firebaseArray',
        '$ionicHistory',
        'dragulaService',
        function ($rootScope, $scope, $attrs, $parse, $interpolate, $log, dateFilter, calendar2Config, $timeout, $localstorage, $ionicModal, LocationService, $ionicPlatform, $state, $ionicLoading, FIREBASE_URL, $firebaseArray, $ionicHistory, dragulaService) {
        'use strict';

        dragulaService.options($scope, 'dropArea', {
            invalid: function(el){
                return el.className === "drag-element";
            },
            moves: function (el, container, handle) {
               return handle.className === 'node-handle';
             }
        });

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
        var ref = new Firebase(FIREBASE_URL);
        var eventsRef = ref.child('events').orderByChild('date');
        $scope.calEvents = $firebaseArray(eventsRef);

        $scope.calEvents.$loaded(function(data){
            if(!$scope.isCalView){// filtering out events that don't need volunteers for volunteer signup view
                for (var i = data.length - 1; i >= 0; i--) {
                    if(!data[i].volunteer_hours){
                        data.splice(i, 1);
                    }
                }
            }
            $scope.eventSource = [];
            for (var i = data.length - 1; i >= 0; i--) {
                if(data[i].setup_start){
                    var setupObj = {
                        allday: false,
                        location: data[i].location,
                        startTime: data[i].setup_start,
                        endTime:data[i].setup_end,
                        type: 'setup',
                        volunteersNeeded: data[i].setup_volunteers_needed,
                        backgroundColor: 'primaryGreen',
                        title: data[i].event_title + ' setup',
                        startTimeOffset: getTimeOffset(new Date(data[i].setup_start)),
                        totalApptTime: getApptTime(new Date(data[i].setup_start), new Date(data[i].setup_end))
                    }
                    $scope.eventSource.push(setupObj);
                }
                if(data[i].cleanup_start){
                    var cleanupObj = {
                        allDay: false,
                        location: data[i].location,
                        startTime: data[i].cleanup_start,
                        endTime: data[i].cleanup_end,
                        type: 'cleanup',
                        volunteersNeeded: data[i].cleanup_volunteers_needed,
                        backgroundColor: 'primaryRed',
                        title: data[i].event_title + ' cleanup',
                        startTimeOffset: getTimeOffset(new Date(data[i].cleanup_start)),
                        totalApptTime: getApptTime(new Date(data[i].cleanup_start), new Date(data[i].cleanup_end))
                    }
                    $scope.eventSource.push(cleanupObj);
                }
                var eventObj = {
                    allDay: false,
                    location: data[i].location,
                    startTime: data[i].event_start,
                    endTime: data[i].event_end,
                    type: 'event',
                    volunteersNeeded: data[i].volunteers_needed,
                    backgroundColor: 'primaryBlue',
                    title: data[i].event_title,
                    startTimeOffset: getTimeOffset(new Date(data[i].event_start)),
                    totalApptTime: getApptTime(new Date(data[i].event_start), new Date(data[i].event_end))
                }
                $scope.eventSource.push(eventObj);
            }
            $scope.filteredEvents = $scope.eventSource;
        });

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

        $scope.event = {};

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
        
        $ionicModal.fromTemplateUrl('templates/add_event.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.modal = modal;
        });

        $scope.selectedHour = {};

        $scope.endHour = function(startHour){
            var endHour,
                hrRegEx = /^\w+/g,
                hour = parseInt(hrRegEx.exec(startHour)),
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
        if($ionicHistory.currentView().title === 'Calendar'){
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
            }
        }

        // $scope.$on('dropArea.drag', function(e, el){
        //     debugger;
        // });
        // $scope.$on('dropArea.dragEnd', function(e, el){
        //     debugger;
        // });
        // $scope.$on('dropArea.drop', function(e, el){
        //     debugger;
        // });
        // $scope.$on('dropArea.cancel', function(e, el){
        //     debugger;
        // });
        // $scope.$on('dropArea.removeClass', function(e, el){
        //     debugger;
        // });
        // $scope.$on('dropArea.shadow', function(e, el){
        //     debugger;
        // });
        // $scope.$on('dropArea.over', function(e, el){
        //     debugger;
        // });
        // $scope.$on('dropArea.out', function(e, el){
        //     debugger;
        // });

        $scope.hourTouch = function($event){
            if($scope.selectedHour.el && $scope.selectedHour.hashKey !== $event.currentTarget.$$hashKey){//selected a different hour
                $event.currentTarget.firstElementChild.style.display = "inline-block";
                $scope.selectedHour.el.firstElementChild.style.display = "none";
                $scope.selectedHour.el = $event.currentTarget;
                $scope.selectedHour.hashKey = $event.currentTarget.$$hashKey;
            } else if($scope.selectedHour.el && $scope.selectedHour.hashKey === $event.currentTarget.$$hashKey){//selected the same hour again
                var children = angular.element($scope.selectedHour.el).parent();;
                var start = children.parent().children()[children.parent().children().length - 1].innerHTML;
                $scope.volunteerStart = moment(new Date($scope.title + " " +  start));
                $scope.displayStart = $scope.volunteerStart.format('h:mm a');
                $scope.selectedHour.hashKey = null; 
                if($ionicHistory.currentView().title === 'Calendar'){
                    $scope.eventStartDate = new Date($scope.title);
                    $scope.eventEndDate = new Date($scope.title);
                    $scope.eventStartTime = new Date($scope.title + " " + start);
                    $scope.eventEndTime = new Date($scope.title + " " + $scope.endHour(start));
                    $scope.addEventModal();  
                } else {
                    $scope.selectedHour.el.firstElementChild.innerHTML = "Start: " + $scope.displayStart;
                    $scope.selectedHour.el.firstElementChild.className = "volunteer-start";
                    $scope.selectedHour.el.firstElementChild.style.display = "inline-block"
                    $scope.displayEnd = $scope.volunteerStart.add(1, 'h').format('h:mm a');
                    var selectedHour = angular.element($scope.selectedHour.el);
                    $scope.dragEl = selectedHour.parent().next().children()[0];
                    $scope.dragEl.style.display = 'inherit';
                    $timeout(function(){
                        $scope.signupShown = true;
                    }, 500);
                }
            } else {//first hour selection made
                $event.currentTarget.firstElementChild.style.display = "inline-block"; 
                $scope.selectedHour.el = $event.currentTarget;
                $scope.selectedHour.hashKey = $event.currentTarget.$$hashKey
            }
        }
        $scope.hasSetup = function(){
            if($scope.event.setup_volunteers_needed && $scope.event.setup_volunteers_needed != 0){
                $scope.setupStartTime = moment($scope.eventStartTime).subtract(2, 'hours')._d;
                $scope.setupEndTime = $scope.eventStartTime;
                $scope.setupStartDate = $scope.eventStartDate;
                $scope.setupEndDate = $scope.eventStartDate;
            }
        }

        $scope.hasCleanup = function(){
            if($scope.event.cleanup_volunteers_needed && $scope.event.setup_volunteers_needed != 0){
                $scope.cleanupEndTime = moment($scope.eventEndTime).add(2, 'hours')._d;
                $scope.cleanupStartTime = $scope.eventEndTime;
                $scope.cleanupStartDate = $scope.eventStartDate;
                $scope.cleanupEndDate = $scope.eventStartDate;
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
            $scope.event.event_start = moment(moment($scope.eventStartDate).format('ddd, MMM DD, YYYY') + " " + moment($scope.eventStartTime).format('hh:mm a'))._d.toString();
            $scope.event.event_end = moment(moment($scope.eventStartDate).format('ddd, MMM DD, YYYY') + " " + moment($scope.eventEndTime).format('hh:mm a'))._d.toString();
            if($scope.event.setup_start){
                $scope.event.setup_start = moment(moment($scope.setupStartDate).format('ddd, MMM DD, YYYY') + " " + moment($scope.setupStartTime).format('hh:mm a'))._d.toString();
                $scope.event.setup_end = moment(moment($scope.setupStartDate).format('ddd, MMM DD, YYYY') + " " + moment($scope.setupEndTime).format('hh:mm a'))._d.toString(); 
            }
            if($scope.event.cleanup_start){
                $scope.event.cleanup_start = moment(moment($scope.cleanupStartDate).format('ddd, MMM DD, YYYY') + " " + moment($scope.cleanupStartTime).format('hh:mm a'))._d.toString();
                $scope.event.cleanup_end = moment(moment($scope.cleanupStartDate).format('ddd, MMM DD, YYYY') + " " + moment($scope.cleanupEndTime).format('hh:mm a'))._d.toString();
            }
            if($scope.event.setup_volunteers_needed || $scope.event.cleanup_volunteers_needed || $scope.event.volunteers_needed){
                $scope.event.volunteer_hours = moment($scope.event.setup_end).diff($scope.event.setup_start, 'hours') * $scope.event.setup_volunteers_needed + moment($scope.event.event_end).diff($scope.event.event_start, 'hours') * $scope.event.volunteers_needed + moment($scope.event.cleanup_end).diff($scope.event.cleanup_start, 'hours') * $scope.event.cleanup_volunteers_needed;  
            }
            
            // This is needed to order the events chronologically in the view
            $scope.event.date = $scope.eventStartDate.getTime();
            var ref = new Firebase(FIREBASE_URL);
            var eventsRef = ref.child('events');
            eventsRef.push($scope.event);
            $scope.saved(event.event_title, $scope.closeModal());
            $state.go('app.volunteer');
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
                // $scope.repairShopOpenTime = $scope.$root.repairShopHours[this.range.startTime.getDay()].open_time;
                // $scope.repairShopCloseTime = $scope.$root.repairShopHours[this.range.startTime.getDay()].close_time;
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
                    scope.$parent.title = dateFilter(headerDate, ctrl.formatMonthTitle);
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

                function compareEvent(event1, event2) {
                    // if (event1.allDay) {
                    //     return 1;
                    // } else if (event2.allDay) {
                    //     return -1;
                    // } else {
                    //     return (event1.startTime.getTime() - event2.startTime.getTime());
                    // }
                }

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
                    scope.$parent.title = dateFilter(headerDate, ctrl.formatMonthTitle);
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

                function updateScrollGutter() {
                    // var children = element.children();
                    // var allDayEventBody = children[1].children[1];
                    // var allDayEventGutterWidth = allDayEventBody.offsetWidth - allDayEventBody.clientWidth;
                    // var normalEventBody = children[2];
                    // var normalEventGutterWidth = normalEventBody.offsetWidth - normalEventBody.clientWidth;
                    // var gutterWidth = allDayEventGutterWidth || normalEventGutterWidth || 0;
                    // if (gutterWidth > 0) {
                    //     scope.gutterWidth = gutterWidth;
                    //     if (allDayEventGutterWidth <= 0) {
                    //         scope.allDayEventGutterWidth = gutterWidth;
                    //     } else {
                    //         scope.allDayEventGutterWidth = 0;
                    //     }
                    //     if (normalEventGutterWidth <= 0) {
                    //         scope.normalGutterWidth = gutterWidth;
                    //     } else {
                    //         scope.normalGutterWidth = 0;
                    //     }
                    // }
                }

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
                        title;

                    scope.rows = createDateObjects(firstDayOfWeek);
                    scope.dates = dates;
                    weekNumberIndex = ctrl.formatWeekTitle.indexOf(weekFormatPattern);
                    title = dateFilter(firstDayOfWeek, ctrl.formatWeekTitle);
                    if (weekNumberIndex !== -1) {
                        title = title.replace(weekFormatPattern, getISO8601WeekNumber(firstDayOfWeek));
                    }
                    scope.$parent.title = title;
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
                    scope.$parent.title = dateFilter(startingDate, ctrl.formatDayTitle);
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
