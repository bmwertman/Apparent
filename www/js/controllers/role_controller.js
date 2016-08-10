Pta.controller('RoleCtrl', [
  '$scope',
  'userService',
  '$ionicPopup',
  '$firebaseArray',
  'userFilter',
  function ($scope, userService, $ionicPopup, $firebaseArray, userFilter) {
  $scope.user = userService.getUser();  
  
  var ref = firebase.database().ref(),
      rolesRef = ref.child('roles/' + $scope.user.school),
      users = firebase.database().ref('users'),
      parents = $firebaseArray(users.orderByChild('school').equalTo($scope.user.school)),
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

  parents.$loaded()
  .then(function(schoolParents){
      $scope.schoolParents = schoolParents;
  });
  $scope.showOptions = false;
  $scope.roles = $firebaseArray(rolesRef);

  $scope.addRole = function(){
    rolesRef.push({title: "", user_name: "", user_id: ""});
  }

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
  
  $scope.confirmChange = function(user, role){
    var newAdminRef = 'users/' + user.$id + '/isAdmin',
        updates = {};
    updates[newAdminRef] = true;
    if(role.user_id && role.user_id.length > 0){
      var oldAdminRef = 'users/' + role.user_id + '/isAdmin',
          confirmPopup = $ionicPopup.confirm({
            title: "You are replacing " + role.user_name + " as " + role.title,
            template: "Are you sure you want to replace " + role.user_name + " with " + user.name + "?",
            okText: "Save",
            okType: "button-balanced"
          });
  
      confirmPopup.then(function(res){
        if(res){
          updates[oldAdminRef] = false;
          ref.update(updates);
          rolesRef.child(role.$id).update({
            user_name: user.name,
            user_id: user.$id,
            user_pic: user.pic
          });
        }
      });
    } else {
      ref.update(updates);
      rolesRef.child(role.$id).update({
        user_name: user.name,
        user_id: user.$id,
        user_pic: user.pic
      });
    }
  }

}]);