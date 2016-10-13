Pta.controller('SettingsCtrl', [
  '$scope',
  'userService',
  '$firebaseObject',
  '$cordovaImagePicker',
  'imgStorage',
  'modalService',
  '$ionicHistory',
  function($scope, userService, $firebaseObject, $cordovaImagePicker, imgStorage, modalService, $ionicHistory) {
    $scope.user = userService.getUser();
    var school = $firebaseObject(firebase.database().ref('schools').child($scope.user.school));
    if(school){
      school.$loaded(function(school){
        $scope.school = school;
      });
    }

    function checkHistory(){
      console.log($ionicHistory.currentView());
      debugger;
    }
    checkHistory();

    $scope.storeImage = function(file, storageDir, imgName, imgUse, closeModal) {
      storageDir = 'logo_pics';
      imgName = $scope.user.school
      imgUse = 'logo';
      imgStorage.storeImage(file, storageDir, imgName, imgUse, closeModal);
    }

    //image pick & crop
    $scope.getImage = function(){
      $cordovaImagePicker.getPictures({
      maximumImagesCount: 1
      })
      .then(function (results) {
        $scope.picFile = results[0];
        modalService
        .init('templates/rectangular-crop.html', $scope)
        .then(function(modal){
          modal.show();
        });
      }, function(error) {
       console.log(error)
      });
    }
}]);

// function saveToken(){
//   gapi.auth.setToken(response);
//   school.document_storage_token = response.access_token;
//   school.storage_type = "googleDrive";
//   school.$save();
// }

// $scope.gapiAuth = function () {
//   gapi.auth.authorize({
//     'client_id': gapiClientId,
//     'scopes': 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive/file',
//     'immediate': false 
//   }, saveToken);
// };

// Drive.authenticate({redirect_uri: 'http://localhost/drive'})
// .then(function (response) {//authenticate
//   if (response) {
//     gapi.auth.setToken(response);
//     school.document_storage_token = response.access_token;
//     school.storage_type = "googleDrive";
//     school.$save();
//   }
// },
// function (error) {
//   console.log("" + error);
// });

