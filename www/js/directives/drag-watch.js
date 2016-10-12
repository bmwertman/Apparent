Pta.directive('dragWatch', [
    'time',
    function (time) {

    return {

        link: function (scope, element, attrs) {
 
            scope.$watch(function () {
                return parseInt(element.css(attrs['offsetTop']));
            },  styleChangedCallBack,
            true);
            
            var runningCount = 0;
            var initDrag = true;

            function styleChangedCallBack(newValue, oldValue) {
                if(initDrag){
                    scope.dateTime = moment(time.parseTime(scope.displayEnd, scope.latestFinish._d)).add({minutes:60});
                    scope.displayEnd = scope.dateTime.format('h:mm a');
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
                        
                        if(runningCount >= 40){
                            runningCount = runningCount - 40;
                            obj.minutes = 60;
                            return obj; //rounded Y-axis position change in pixels
                        }
                    }
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
