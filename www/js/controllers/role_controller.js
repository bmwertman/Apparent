Pta.controller('RoleCtrl', [
  '$scope',
  'userService',
  '$ionicPopup',
  '$firebaseArray',
  '$timeout',
  function ($scope, userService, $ionicPopup, $firebaseArray, $timeout) {
  $scope.user = userService.getUser();  
  
  var ref = firebase.database().ref(),
      rolesRef = ref.child('roles/' + $scope.user.school),
      adminWarp = {
        path:{ 
            radius: 24,
            angle: "185deg",
            textPosition: "inside" 
        },
        css: "letter-spacing: 3px; font-weight: bold;",
        targets:"#adminwarp",
        align: "center",
      };
  cssWarp(adminWarp);

  $scope.roles = $firebaseArray(rolesRef);

  $scope.addRole = function(){
    rolesRef.push({title: "", user: ""});
  }

  $scope.roleAssignees = document.getElementsByClassName('role-assignees');
  
  $timeout(function(){
    $scope.$watchGroup('roleAssignees', function(newValues, oldValues, $scope){
      debugger;
    });
  });

  $scope.removeRole = function(role){
    if(role.user && role.title){
      if(role.user.length > 0 && role.title.length > 0){
        var popupTitle = "You are removing " + role.title + " as a role",
            popupTemplate = "Are you sure you want to remove " + role.user + "'s role?";
      } else {
        var popupTitle = "You are about to remove a role",
            popupTemplate = "Are you sure you want to remove this role?";
      }
      
      var confirmPopup = $ionicPopup.confirm({
        title: popupTitle,
        template: popupTemplate,
        okText: "Save",
        okType: "button-balanced"
      });
      confirmPopup.then(function(res){
        if(res){
          $scope.roles.$remove(role);
        }
      });
    } else {
      $scope.roles.$remove(role);
    } 
  }

  // $scope.confirmChange = function(role){
  //   var popupTitle,
  //       popupTemplate,
  //       confirmPopup = $ionicPopup.confirm({
  //         title: popupTitle,
  //         template: popupTemplate,
  //         okText: "Save",
  //         okType: "button-balanced"
  //       });
  //   if(role.user.length > 0 && role.title.length > 0){
  //     popupTitle = "You are replacing " + role.user + " as" + role.title;
  //     popupTemplate = "Are you sure you want to replace" + role.user + " with " + $scope.role.user + "?";
  //     confirmPopup.then(function(res){
  //       if(res){
  //         $scope.roles.$save(role);
  //       }
  //     });
  //   } else {
  //     $scope.roles.$save(role)
  //   }
  // }

}]);