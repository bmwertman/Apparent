Pta.factory('Rooms', [
  '$firebaseArray',
  '$firebaseObject',
  'userService',
  function ($firebaseArray, $firebaseObject, userService) {
  var ref = firebase.database().ref(),
      user = userService.getUser();
      userRoomsRef = firebase.database().ref('user-rooms').child(user.$id),
      roomsRef = firebase.database().ref('/rooms');
  return {
      all: function () {
        return $firebaseArray(userRoomsRef);
      },
      get: function (roomId) {
        return $firebaseObject(userRoomsRef.child(roomId));
      },
      addNewRoom: function(users, roomPath, newRoomId, subject){
        var chatter, firstName, lastName,
        namesArr = [],
        room = {},
        updates = {};

        room.chatters = [];
        users.push(user);
        angular.forEach(users, function(value, key){
          chatter = {};
          chatter.id = value.$id;
          chatter.email = value.email;
          chatter.name = value.name;
          chatter.pic = value.pic;
          if(chatter.id === user.$id){
            room.owner = chatter.id;
          }
          room.chatters.push(chatter);
        });
        if(subject){// The room is tied to some type of event
          room.subject = subject.title
          updates[roomPath + subject.id + '/' + newRoomId] = room; 
        }
        // if(room.chatters.length > 2 || subject){// Creating a group chat room
        for (var i = room.chatters.length - 1; i >= 0; i--) {
          firstName = room.chatters[i].name.split(' ')[0];
          lastName = room.chatters[i].name.split(' ')[1];
          namesArr.push(firstName + " " + lastName.charAt(0));
        }
        namesArr.reverse();
        for (var i = room.chatters.length - 1; i >= 0; i--) {
          var toBeUpdated = namesArr.splice(i, 1),// Pull the users name from the title whose userRooms we're adding this to
              obj = {},
              roomInstance = angular.extend(obj, room);
          roomInstance.title = namesArr.join(', ');// Create the title
          if(subject){ roomInstance.subject = subject.title}
          updates['/user-rooms/' + room.chatters[i].id + '/' + newRoomId] = roomInstance;// Format the firebase update
          namesArr.splice(i, 0, toBeUpdated[0]);// Put that user's name back in the same place for the next title 
        }
        // } else 
        if(room.chatters.length > 1){// Creating a one-on-one chat room
          updates['/user-rooms/' + room.chatters[0].id + '/' + newRoomId] = room;
          updates['/user-rooms/' + room.chatters[1].id + '/' + newRoomId] = room;
        } else {
          updates['/user-rooms/' + room.chatters[0].id + '/' + newRoomId] = room;
        }
        updates['/rooms/' + newRoomId] = room;
        ref.update(updates);
        return newRoomId;
      } 
  }
}]);