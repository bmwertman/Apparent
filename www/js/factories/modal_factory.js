Pta.factory('modalService', [
  '$ionicModal',
  '$rootScope',
  function($ionicModal, $rootScope) {
  return {
    init: function(tpl, $scope) {

      $scope = $scope || $rootScope.$new();
      
      var promise = $ionicModal.fromTemplateUrl(tpl, {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.modal = modal;
        return modal;
      });

      $scope.openModal = function() {
         $scope.modal.show();
       };
       $scope.closeModal = function() {
         $scope.modal.hide();
       };
       $scope.$on('$destroy', function() {
         $scope.modal.remove();
       });

      return promise;
    }
  }
}]);