Pta.directive('ignoreCompositionEvent', function () {
    return {
        restrict: 'A',
        link: function postLink(scope, element) {
            if(scope.signupForm.$invalid){
              element.off('compositionstart').off('compositionend');
            }
        }
    };
});