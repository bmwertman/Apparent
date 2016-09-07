Pta.factory('pushSubscribe', [
  '$firebaseArray',
  function ($firebaseArray) {
  return $firebaseArray.$extend({
    $$added: function(room){
      // Room topic is the $id of the chat room
      FCMPlugin.subscribeToTopic(room.key);
    },
    $$removed: function(room){
      FCMPlugin.unsubscribeFromTopic(room.key);
    }
  });
}]);

// Subscibes or unsubscribes users to push notifications
// as new rooms are added or removed from their user-rooms
// see rooms_factory.js implementation