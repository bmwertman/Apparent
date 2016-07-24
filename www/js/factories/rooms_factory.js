Pta.factory('Rooms', ['$firebaseArray', function ($firebaseArray) {
     // Might use a resource here that returns a JSON array
  var ref = firebase.database().ref(),
      rooms = $firebaseArray(ref.child('rooms'));//General chat rooms
      
  return {
      all: function () {
          return rooms;
      },
      get: function (roomId) {
          return rooms.$getRecord(roomId);
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
      }
  }
}]);