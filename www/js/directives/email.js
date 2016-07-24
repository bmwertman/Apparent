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
    }
}]);