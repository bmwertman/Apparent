Pta.controller('RoleCtrl', [
  '$scope',
  'userService',
  '$ionicPopup',
  '$firebaseArray',
  'userFilter',
  '$localstorage',
  '$ionicActionSheet',
  '$timeout',
  function ($scope, userService, $ionicPopup, $firebaseArray, userFilter, $localstorage, $ionicActionSheet, $timeout) {
  $scope.user = userService.getUser();  
  $localstorage.remove('roleEditStart');

  var ref = firebase.database().ref(),
      rolesRef = ref.child('roles/' + $scope.user.school),
      roles = $firebaseArray(rolesRef),
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

  roles.$loaded()
  .then(function(userRoles){
    $scope.roles = userRoles;
  });

  parents.$loaded()
  .then(function(schoolParents){
      $scope.schoolParents = schoolParents;
  });

  $scope.showOptions = false;

  $scope.addRole = function(){
    rolesRef.push({title: "", user_name: "", user_id: ""});
  }

  $scope.startRoleSearch = function(roleIndex){
    if($scope.roles[roleIndex].user_id){
      $localstorage.setObject('roleEditStart', $scope.roles[roleIndex]);
      $scope.roleIndex = roleIndex;
    }
  }

  $scope.endRoleSearch = function(){
    var role = $scope.roles[$scope.roleIndex],
        storedRole = $localstorage.getObject('roleEditStart');
    if(!angular.equals(role, storedRole) && role){
      angular.forEach(storedRole, function(value, key){
        role[key] = value
      });
    }
  }

  $scope.removeRole = function(role){
    var adminUpdate = {};
    adminUpdate['users/' + role.user_id + '/isAdmin'] = false;
    if($scope.roles.length > 1){
      if(role.title.length > 0){
        var popupTitle = role.title + " Removed",
        undoActionSheet = $ionicActionSheet.show({
          buttons: [
            {text: "<b>UNDO</b>"}
          ],
          titleText: popupTitle,
          cssClass: 'undo-actionsheet',
          buttonClicked: function(){
            var role = $localstorage.getObject('savedRole');
            delete role.$id;
            delete role.$$hashKey;
            delete role.$priority;
            rolesRef.push(role);
            adminUpdate['users/' + role.user_id + '/isAdmin'] = true;
            ref.update(adminUpdate);
            $localstorage.remove('savedRole');
            return true;
          }
        });
        ref.update(adminUpdate);
        $localstorage.setObject('savedRole', role);
        $scope.roles.$remove(role);
      } else {
        $scope.roles.$remove(role);
      }
      $timeout(function(){
         undoActionSheet();
         $localstorage.remove('savedRole');
      }, 5000); 
    } else {
      var lastAdmin = $ionicPopup.alert({
        title: "This is the last admin on your account!",
        template: "Deleting this admin will leave your school unable to update content. Please add another admin before deleting this admin."
      });
      lastAdmin;
    }
  }

  $scope.confirmChange = function(user, role, roles){
    if($localstorage.getObject('roleEditStart')){
      $localstorage.remove('roleEditStart');
    }
    var newAdminRef = 'users/' + user.$id + '/isAdmin',
        duplicates = 0;
        updates = {};
    updates[newAdminRef] = true;
    if(role.user_id && role.user_id.length > 0){
      $localstorage.setObject('savedRole', role);
      $localstorage.setObject('savedUser', user);
      var oldAdminRef = 'users/' + role.user_id + '/isAdmin',
          undoActionSheet = $ionicActionSheet.show({// Show an action sheet to let the user undo changes
            buttons: [
              {text: "<b>UNDO</b>"}
            ],
            titleText: "Replaced " + role.user_name + " with " + user.name + " as " + role.title,
            cssClass: 'undo-actionsheet',
            buttonClicked: function(){
              duplicates = 0;
              var role = $localstorage.getObject('savedRole'),
                  user = $localstorage.getObject('savedUser');
              delete role.$id;
              delete role.$$hashKey;
              delete role.$priority;
              // Check if the user being removed holds more than one role 
              for (var i = roles.length - 1; i >= 0; i--) {
                if(roles[i].user_id === user.$id){
                  duplicates++;
                }
              }
              if(duplicates < 2) { // If the user doesn't then set their isAdmin to false
                updates[newAdminRef] = false;
              }
              updates[oldAdminRef] = true;
              ref.update(updates);
              // Undo the user swap in the roles $firebaseArray
              var keys = roles.map(function(e) { return e.$id; }),
                  indexOfKey = roles.map(function(e) { return e.user_id; }).indexOf(user.$id);
              roles.$remove(indexOfKey);
              roles.$add(role);
              $localstorage.remove('savedRole');
              $localstorage.remove('savedUser');
              return true;
            }
          });
      // Check if the user being removed holds more than one role 
      for (var i = roles.length - 1; i >= 0; i--) {
        if(roles[i].user_id === role.user_id){
          duplicates++;
        }
      }
      if(duplicates < 2) { // If the user doesn't then set their isAdmin to false
        updates[oldAdminRef] = false;
      }
      //Add the replacement user for this role
      ref.update(updates);
      rolesRef.child(role.$id).update({
        user_name: user.name,
        user_id: user.$id,
        user_pic: user.pic
      });
      $timeout(function(){// Hide the action sheet and cleanup localstorage items related to this change
         undoActionSheet();
         $localstorage.remove('savedRole');
         $localstorage.remove('savedUser');
      }, 5000); 
    } else {// This is someone adding a new role, not a change
      ref.update(updates);
      rolesRef.child(role.$id).update({
        user_name: user.name,
        user_id: user.$id,
        user_pic: user.pic
      });
    }
  }
  
}]);