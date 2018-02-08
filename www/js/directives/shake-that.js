Pta.directive('shakeThat', ['$animate', function($animate) {
  return {
    require: '^form',
    scope: '=',
    link: function(scope, element, attrs, form) {
      element.on('submit', function() {
          scope.$apply(function() {
            if (form.$valid) {
              scope.submitted = true;
            } else {
              angular.forEach(form.$error, function(value, key){
                var el = document.getElementById(key)
                scope.errorMessage = "Invalid " + key;
                $animate.addClass(el, 'shake', function() {
                  $animate.removeClass(el, 'shake');
                });
              });
              scope.showMessage = true;
            }
          });
      });
    }
  };
}]);