Pta.controller('ChatCtrl', [
    '$scope',
    'Chats',
    '$state',
    '$timeout',
    '$ionicScrollDelegate',
    'userService',
    'dateFilter',
    function ($scope, Chats, $state, $timeout, $ionicScrollDelegate, userService, dateFilter) {
    $scope.IM = { textMessage: "" };
    $scope.user =  userService.getUser();
    $scope.data = {};

    $scope.slide = function(e){
        var userChats = angular.element(document.getElementsByClassName('user')),
            times = angular.element(document.getElementsByClassName('time'))
            Usertimes = angular.element(document.getElementsByClassName('user-time'));
        if(e.type === "swiperight"){
            times.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(72px, 0, 0)'});
            Usertimes.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(72px, 0, 0)'});
            userChats.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(72px, 0, 0)'});
            userChats.attr({'style': ''});
        } else {
            times.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(-72px, 0, 0)'});
            Usertimes.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(-72px, 0, 0)'});
            userChats.css({
                'transition': 'all 250ms ease-in-out',
                'transform':'translate3D(-72px, 0, 0)'});
        }
    }

    Chats.selectRoom($state.params.roomId);

    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS(),
        selectedRoom = Chats.getSelectedRoomName();

    selectedRoom.$loaded()
    .then(function(){
        if (selectedRoom) {
            // Fetching Chat Records only if a Room is Selected
            $scope.$emit('subject', selectedRoom.subject)
            $scope.roomName = selectedRoom.title;
            $scope.chats = Chats.all();
        } else {
            $scope.chats = [];
        }
    });

    $scope.sendMessage = function() {
        Chats.send($scope.user, $scope.IM.textMessage);
        $scope.IM.textMessage = "";

        $ionicScrollDelegate.scrollBottom(true);
    };

    // $scope.inputUp = function() {
    //     if (isIOS) $scope.data.keyboardHeight = 216;
    //         $timeout(function() {
    //         $ionicScrollDelegate.scrollBottom(true);
    //     }, 300);
    // };

    // $scope.inputDown = function() {
    //     if (isIOS) $scope.data.keyboardHeight = 0;
    //     $ionicScrollDelegate.resize();
    // };

}]);