Pta.controller('VolunteerCtrl', [
    '$scope',
    '$state',
    'Rooms',
    'userService',
    '$firebaseObject',
    function ($scope, $state, Rooms, userService, $firebaseObject) {
    $scope.user = userService.getUser();
    $scope.thisHoursVolunteers = $state.params.thisHoursVolunteers;
    $scope.thisEvent = $state.params.thisEvent;
    var userRoomsRef = firebase.database().ref('user-rooms');
    var chatWarp = {
            path:{ 
                radius: 14,
                angle: "0deg" 
            },
            targets:"#chatwarp",
            align: "center",
        },
        allWarp = {
            path:{ 
                radius: 28,
                angle: "180deg",
                textPosition: "inside" 
            },
            targets:"#allwarp",
            align: "center",
        };

    cssWarp(chatWarp, allWarp);

    $scope.createRoom = function(volunteers, event, volunteer) {
        $firebaseObject(userRoomsRef.child(volunteer.$id).child(event.id))
        .$loaded()
        .then(function(){

        })
        var volunteersArr = [];
        if(volunteer){
            volunteersArr.push(volunteer.user);
        } else {
            for (var i = volunteers.length - 1; i >= 0; i--) {
                if(volunteers[i].user.$id !== $scope.user.$id){
                    volunteersArr.push(volunteers[i].user);
                }
            }
        }
        var id = Rooms.addNewRoom(volunteersArr, '/event-rooms/', event);
        $state.go('app.rooms.chat', {roomId: id});
    }
}]);    