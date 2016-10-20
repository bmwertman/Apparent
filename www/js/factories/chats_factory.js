Pta.factory('Chats', [
    'Rooms',
    '$firebaseArray',
    'userService',
    '$ionicScrollDelegate',
    '$timeout',
    function (Rooms, $firebaseArray, userService, $ionicScrollDelegate, $timeout) {

    var selectedRoomId,
        chats,
        user = userService.getUser();
        ref = firebase.database().ref();
    return {
        all: function () {
            return chats;
        },
        remove: function (chat) {
            chats.$remove(chat).then(function (ref) {
                ref.key() === chat.$id; // true item has been removed
            });
        },
        get: function (chatId) {
            for (var i = 0; i < chats.length; i++) {
                if (chats[i].id === parseInt(chatId)) {
                    return chats[i];
                }
            }
            return null;
        },
        getSelectedRoomName: function () {
            var selectedRoom;
            if (selectedRoomId && selectedRoomId != null) {
                return Rooms.get(selectedRoomId);
            } else {
                return null;
            }
        },
        selectRoom: function (roomId) {
            selectedRoomId = roomId;
            chats = $firebaseArray(ref.child('rooms').child(selectedRoomId).child('chats'));
        },
        send: function (sender, message) {
            if (sender && message) {
                var chatMessage = {
                    userId: sender.$id,
                    from: sender.name,
                    message: message,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                }
                chats.$loaded()
                .then(function(){
                    var lastAdded = chats.$getRecord(chats.$keyAt(chats.length - 1));
                    if(lastAdded && lastAdded.userId !== sender.$id){//only add a pic if the previous sender wasn't the same person
                        if(!sender.pic){
                          chatMessage.pic = sender.name.charAt(0);// if no pic use first letter of first name
                        } else {
                          chatMessage.pic = sender.pic;
                        }
                        chats.$add(chatMessage);
                    } else if(!lastAdded){// Or if this is the first chat in a room
                        if(!sender.pic){
                          chatMessage.pic = sender.name.charAt(0);// if no pic use first letter of first name
                        } else {
                          chatMessage.pic = sender.pic;
                        }
                        chats.$add(chatMessage);
                    } else {
                        chats.$add(chatMessage);
                    }
                });
                $ionicScrollDelegate.scrollBy(0, 44, true);
            }
        }
    }
}]);