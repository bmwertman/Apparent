Pta.directive("detectFocus", function ($focusTest) {
    return {
        restrict: "A",
        scope: {
            onFocus: '&onFocus',
            onBlur: '&onBlur',
        },
        link: function (scope, elem) {

            elem.on("focus", function () {
                scope.onFocus();
                $focusTest.setFocusOnBlur(true);
            });

            elem.on("blur", function () {
                scope.onBlur();
                if ($focusTest.getFocusOnBlur())
                    elem[0].focus();
            });
        }
    }
}).service("$focusTest", function(){

  this.focusOnBlur = true;

  this.setFocusOnBlur = function(val){
      this.focusOnBlur = val;
  }

  this.getFocusOnBlur = function(){
      return this.focusOnBlur;
  }
});