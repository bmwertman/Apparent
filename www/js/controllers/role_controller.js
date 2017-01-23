Pta.controller('RoleCtrl', [
  '$scope',
  'userService',
  '$ionicPopup',
  '$firebaseArray',
  'userFilter',
  '$localstorage',
  '$ionicActionSheet',
  '$timeout',
  '$filter',
  function ($scope, userService, $ionicPopup, $firebaseArray, userFilter, $localstorage, $ionicActionSheet, $timeout, $filter) {
  $scope.user = userService.getUser();  
  $localstorage.remove('roleEditStart');

  var user = userService.getUser(),
      ref = firebase.database().ref(),
      userRoomsRef = firebase.database().ref('user-rooms').child(user.user_id),
      userRooms = $firebaseArray(userRoomsRef),
      users = firebase.database().ref('users'),
      parents = $firebaseArray(users.orderByChild('school').equalTo(user.school));

  parents.$loaded()
  .then(function(schoolParents){
    $scope.schoolParents = schoolParents;
    $scope.boardmembers = $filter('filter')(schoolParents, {isAdmin: true});
  });
  
  $scope.showOptions = false;

  $scope.startRoleSearch = function(roleIndex){
    if(roleIndex && $scope.roles[roleIndex].user_id){
      $localstorage.setObject('roleEditStart', $scope.roles[roleIndex]);
      $scope.roleIndex = roleIndex;
    }
  }

  $scope.endRoleSearch = function(){
    if($scope.roleIndex){
      var role = $scope.roles[$scope.roleIndex],
          storedRole = $localstorage.getObject('roleEditStart');
      if(!angular.equals(role, storedRole) && role){
        angular.forEach(storedRole, function(value, key){
          role[key] = value
        });
      }
    }
  }

  $scope.filterParents = function(e){
    $scope.filteredParents = userFilter($scope.schoolParents, e.currentTarget.value);
  }

  $scope.newRole = {};
  $scope.newRoleTitle = function(){
    if($scope.newRole.pic){
      $scope.schoolParents.$save($scope.newRole);
    } else {
      var watchRole = $scope.$watch('newRole.pic', function(){
        if($scope.newRole.pic){
          $scope.schoolParents.$save($scope.newRole);// Update the selected parent's role
          $scope.newRole = {};// Reset blank role
          watchRole();// Unregister watch
        }
      });
    }
  }

  $scope.removeRole = function(role){
    var adminUpdate = {};
    adminUpdate['users/' + role.user_id + '/isAdmin'] = false;
    adminUpdate['users/' + role.user_id + '/title'] = null;
    if($scope.boardmembers.length > 1){
      var runActionsheetCb = true,
          popupTitle;
      if(role.title){
        popupTitle = role.title + " Removed";
      } else if(role.name){
        popupTitle = role.name + " Removed";
      }
      var undoActionSheet = $ionicActionSheet.show({
            buttons: [
              {text: "<b>UNDO</b>"}
            ],
            titleText: popupTitle,
            cssClass: 'undo-actionsheet',
            buttonClicked: function(){
              if(runActionsheetCb){
                var role = $localstorage.getObject('savedRole');
                adminUpdate['users/' + role.user_id + '/isAdmin'] = true;
                adminUpdate['users/' + role.user_id + '/title'] = role.title;
                ref.update(adminUpdate);
                $localstorage.remove('savedRole');
                runActionsheetCb = false;
                return true;
              }
            }
          });
      $localstorage.setObject('savedRole', {
        name: role.name, 
        user_id: role.user_id,
        title: role.title
      });
      ref.update(adminUpdate);
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
    var duplicates = 0;
        updates = {};
    updates['users/' + user.user_id + '/isAdmin'] = true;
    if(role && role.user_id && role.user_id.length > 0){
      var localstorageRole = {
          name: role.name, 
          user_id: role.user_id,
        };
      if(role.title){
        updates['users/' + user.user_id + '/title'] = role.title;
        localstorageRole.title = role.title;
      }
      $localstorage.setObject('savedRole', localstorageRole);
      $localstorage.setObject('savedUser', user);
      var runActionsheetCb = true,
          undoActionSheet = $ionicActionSheet.show({// Show an action sheet to let the user undo changes
            buttons: [
              {text: "<b>UNDO</b>"}
            ],
            titleText: "Replaced " + role.name + " with " + user.name + " as " + role.title,
            cssClass: 'undo-actionsheet',
            buttonClicked: function(){
              if(runActionsheetCb){
                duplicates = 0;
                var role = $localstorage.getObject('savedRole'),
                    user = $localstorage.getObject('savedUser');
                // Check if the user being removed holds more than one role 
                for (var i = $scope.boardmembers.length - 1; i >= 0; i--) {
                  if($scope.boardmembers[i].user_id === user.user_id){
                    duplicates++;
                  }
                }
                if(duplicates < 2) { // If the user doesn't then set their isAdmin to false
                  updates['users/' + user.user_id + '/isAdmin'] = false;
                }
                if(role.title){
                  updates['users/' + role.user_id + '/title'] = role.title;
                  updates['users/' + user.user_id + '/title'] = null;
                }
                updates['users/' + role.user_id + '/isAdmin'] = true;
                ref.update(updates);
                // Undo the user swap in the roles $firebaseArray
                var keys = $scope.boardmembers.map(function(e) { return e.$id; }),
                    indexOfKey = $scope.boardmembers.map(function(e) { return e.user_id; }).indexOf(user.user_id);
                $scope.boardmembers.splice(indexOfKey, 1);
                $scope.boardmembers.push(role);
                $localstorage.remove('savedRole');
                $localstorage.remove('savedUser');
                runActionsheetCb = false;
                return true;
              }
            }
          });
      // Check if the user being removed holds more than one role 
      for (var i = $scope.boardmembers.length - 1; i >= 0; i--) {
        if($scope.boardmembers[i].user_id === role.user_id){
          duplicates++;
        }
      }
      if(duplicates < 2) { // If the user doesn't then set their isAdmin to false
        updates['users/' + role.user_id + '/isAdmin'] = false;
      }
      updates['users/' + role.user_id + '/title'] = null;
      //Add the replacement user for this role
      ref.update(updates);

      $timeout(function(){// Hide the action sheet and cleanup localstorage items related to this change
         undoActionSheet();
         $localstorage.remove('savedRole');
         $localstorage.remove('savedUser');
      }, 5000); 
    } else {// This is someone adding a new role, not a change
      user.isAdmin = true;
      delete user.label;
      $scope.schoolParents.$save(user);
      $scope.boardmembers.push(user);
      $scope.newRole = {};// Reset blank role
    }
  }
  
}]);