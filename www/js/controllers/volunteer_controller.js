Pta.controller('VolunteerCtrl', [
    '$scope',
    '$state',
    'Rooms',
    function ($scope, $state, Rooms) {

    $scope.thisHoursVolunteers = $state.params.thisHoursVolunteers;
    $scope.thisEvent = $state.params.thisEvent;

    $scope.createRoom = function(volunteers, event, volunteer) {
        var volunteersArr = [];
        if(volunteer){
            volunteersArr.push(volunteer.user);
        } else {
            //passing all who are currently volunteered
        }
        
        var id = Rooms.addNewRoom(volunteersArr, '/event-rooms/', event);
        $state.go('app.rooms.chat', {roomId: id});
    }

}]);    