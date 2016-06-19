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
                return parseInt(element.css(attrs['offsetTop']));
            },  styleChangedCallBack,
            true);
            
            var runningCount = 0;
            var initDrag = true;

            function styleChangedCallBack(newValue, oldValue) {
                if(initDrag){
                    scope.displayEnd = moment(parseTime(scope.displayEnd)).add({minutes:45}).format('h:mm a');
                    initDrag = false;
                }

                if (newValue !== oldValue) {
                    function offsetChange(){
                        var actualPixels = newValue - oldValue,
                            obj = {};
                        if(actualPixels > 0){
                            runningCount = runningCount + actualPixels;// Dragging down, increasing time
                        } else {
                            runningCount = runningCount + (actualPixels * -1);// Dragging up, decreasing time
                        }
                        
                        if(runningCount >= 10){
                            runningCount = runningCount - 10;
                            obj.minutes = 15;
                            return obj; //rounded Y-axis position change in pixels
                        }
                        
                    }
                    scope.displayEnd = moment(parseTime(scope.displayEnd))
                    if(newValue > oldValue){ // dragged down = time increase
                       scope.displayEnd = scope.displayEnd.add(offsetChange()).format('h:mm a');
                    } 
                    else if(newValue < oldValue){ // dragged up = time decrease
                        scope.displayEnd = scope.displayEnd.subtract(offsetChange()).format('h:mm a');
                    }
                } 
            }

        }
    };

}]);
