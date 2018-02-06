Pta.directive('shakeThat', ['$animate', function($animate) {
  return {
    require: '^form',
    scope: '=',
    link: function(scope, element, attrs, form) {
      // listen on submit event
      element.on('submit', function() {
        // tell angular to update scope
        scope.$apply(function() {
          if (form.$valid) {
            scope.submitted = true;
            return scope.submit();
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