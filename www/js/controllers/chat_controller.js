Pta.controller('ChatCtrl', [
    '$scope',
    'Chats',
    '$state',
    '$timeout',
    '$ionicScrollDelegate',
    'userService',
    'dateFilter',
    '$http',
    function ($scope, Chats, $state, $timeout, $ionicScrollDelegate, userService, dateFilter, $http) {
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
        selectedRoom = Chats.getSelectedRoomName(),
        chatters = $state.params.chatters;

    selectedRoom.$loaded()
    .then(function(){
        if (selectedRoom) {
            // Fetching Chat Records only if a Room is Selected
            $scope.$emit('subject', selectedRoom.subject)
            // Add room titles
            var titleArr = [];
            angular.forEach(selectedRoom.chatters, function(chatter, key){
                if(chatter.id !== $scope.user.$id){
                  titleArr.push(' ' + chatter.name.split(' ')[0]);
                } 
            });
            $scope.roomName = titleArr.join();
            $scope.chats = Chats.all();
        } else {
            $scope.chats = [];
        }
    });

    $scope.sendMessage = function() {
        // Get the users auth jwt to verify them on the node server 
        firebase.auth().currentUser.getToken(true)
        .then(function(userToken){
            $http({
                method: 'POST',
                url:'https://murmuring-fjord-75421.herokuapp.com/',
                data:{ 
                    token: userToken,
                    message: $scope.IM.textMessage,
                    sender_name: $scope.user.name,
                    topic: '/topics/' + $state.params.roomId,
                    state: 'app.rooms.chat',
                    roomId: $state.params.roomId,
                    sender_imgURL: $scope.user.pic,
                    chatters: chatters 
                }
            })
            .then(function(res){
                Chats.send($scope.user, $scope.IM.textMessage);
                $scope.IM.textMessage = "";
                $ionicScrollDelegate.scrollBottom(true);
            })
            .catch(function(err){
                debugger;
            });
        });
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