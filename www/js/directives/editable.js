Pta.directive('editableValue', ['$compile', function ($compile) {
        'use strict'
        return {
            restrict: 'A',
            link: function (scope, element) {
               element.append($compile('<i class="ion-edit" ng-click="ionEdit.$show()"></i>')(scope));
            }
        }
}]);