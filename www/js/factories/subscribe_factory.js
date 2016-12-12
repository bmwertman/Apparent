Pta.factory('pushSubscribe', [
  '$firebaseArray',
  '$cordovaPushV5',
  function ($firebaseArray, $cordovaPushV5) {
  return $firebaseArray.$extend({
    $$added: function(room){
      // Room topic is the $id of the chat room
      $cordovaPushV5.Push.subscribe(room.key, 
        function(success){
          console.log('success: ', success);
      },
      function(err){
        console.log('Error: ', err);
      });
    },
    $$removed: function(room){
      $cordovaPushV5.Push.unsubscribe(room.key, 
        function(success){
          console.log('success: ', success);
      },
      function(err){
        console.log('Error: ', err);
      });
    }
  });
}]);

// Subscibes or unsubscribes users to push notifications
// as new rooms are added or removed from their user-rooms
// see rooms_factory.js implementation