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
      getIndividualEventRm: function (roomOrEventId, adminId, volunteerId) {
        var eventRef = ref.child('events').child(roomOrEventId),
            eventRooms = $firebaseArray(eventRef.child('rooms')),//event specific chat rooms
            roomId = roomOrEventId + adminId + volunteerId;
        eventRooms.$loaded()
        .then(function(rooms){
          if(eventRooms.$getRecord(roomId)){//This is a general chat unrelated to an event
            return eventRooms.$getRecord(roomId);
          } else {//add a new chat between these users in the created
            eventRooms.once('value')
            .then(function(snapshot){
              var newRoomRef = eventRef.child('rooms').child('roomId'),
                  room;
              if(snapshot.exists()){
                room = $firebaseArray(newRoomRef); // create the room
              } else {
                var obj = {};
                obj[roomId] = newRoomRef;
                eventRooms.$add(obj)
                .then(function(){
                  room = $firebaseArray(newRoomRef); // create the room
                });
              }
              return room.$getRecord(roomId);
            });
          }
        })
        .catch(function(error){
          console.log(error);
        });
      },
      addNewRoom: function(users){
        var chatter, firstName, lastName,
        namesArr = [],
        room = {},
        updates = {},
        newRoomId = roomsRef.push().key;

        room.chatters = [];
        users.push(user);
        angular.forEach(users, function(value, key){
          chatter = {};
          chatter.id = value.$id;
          chatter.email = value.email;
          chatter.name = value.name;
          if(!value.pic){
            chatter.pic = value.name.charAt(0);// if no pic use first letter of first name
          } else {
            chatter.pic = value.pic;
          }
          if(chatter.id === user.$id){
            room.owner = chatter.id;
          }
          room.chatters.push(chatter);
        });
        if(room.chatters.length > 2){
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
            updates['/user-rooms/' + room.chatters[i].id + '/' + newRoomId] = roomInstance;// Format the firebase update
            namesArr.splice(i, 0, toBeUpdated[0]);// Put that user's name back in the same place for the next title 
          }
        } else {
          room.title = room.chatters[0].name;
          updates['/user-rooms/' + room.chatters[0].id + '/' + newRoomId] = room;
          updates['/user-rooms/' + room.chatters[1].id + '/' + newRoomId] = room;
        }
        updates['/rooms/' + newRoomId] = room;
        ref.update(updates);
        return newRoomId;
      } 
  }
}]);