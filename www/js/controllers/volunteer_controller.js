Pta.controller('VolunteerCtrl', [
    '$scope',
    '$state',
    'Rooms',
    'userService',
    '$firebaseObject',
    '$firebaseArray',
    function ($scope, $state, Rooms, userService, $firebaseObject, $firebaseArray) {
    $scope.user = userService.getUser();
    $scope.thisHoursVolunteers = $state.params.thisHoursVolunteers;
    $scope.thisEvent = $state.params.thisEvent;

    var eventRoomsRef = firebase.database().ref('event-rooms');
    var chatWarp = {
            path:{ 
                radius: 14,
                angle: "0deg" 
            },
            targets:"#chatwarp",
            align: "center"
        },
        allWarp = {
            path:{ 
                radius: 28,
                angle: "180deg",
                textPosition: "inside" 
            },
            targets:"#allwarp",
            align: "center"
        };

    cssWarp(chatWarp, allWarp);

    $scope.groupChat = function(event){
        $state.go('app.room', {roomId: event.id + '-group'});
    };

    // Only used to create or open one-on-one rooms.
    // Group chat rooms are created with their corresponding event
    $scope.createRoom = function(volunteers, event, volunteer) {
        var newRoomId = $scope.user.$id + volunteer.user.$id,
            eventRooms = $firebaseArray(eventRoomsRef.child(event.id)),
            volunteersArr = [],
            id;
        if(eventRooms.$indexFor(newRoomId) >= 0){// They have a previous room around this event
            id = newRoomId;
        } else {// It's a new chat around this event
            volunteersArr.push(volunteer.user);
            id = Rooms.addNewRoom(volunteersArr, '/event-rooms/', newRoomId, event);
        }
        $state.go('app.room', {roomId: id});
    };
}]);    









