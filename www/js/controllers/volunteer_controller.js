Pta.controller('VolunteerCtrl', [
    '$scope',
    '$state',
    'Rooms',
    'userService',
    function ($scope, $state, Rooms, userService) {
    var   chatWarp = {
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
    $scope.user = userService.getUser();
    $scope.thisHoursVolunteers = $state.params.thisHoursVolunteers;
    $scope.thisEvent = $state.params.thisEvent;

    cssWarp(chatWarp, allWarp);

    $scope.createRoom = function(volunteers, event, volunteer) {
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