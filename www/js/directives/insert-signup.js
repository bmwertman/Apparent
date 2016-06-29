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