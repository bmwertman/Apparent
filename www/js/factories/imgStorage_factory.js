Pta.factory('imgStorage',[
  'userService',
  '$firebaseObject',
  function(userService, $firebaseObject){
  var user = userService.getUser(),
      school = $firebaseObject(firebase.database().ref('schools').child(user.school));
  return {
    storeImage: function(file, storageDir, imgName, imgUse, cb){
      var imageDataArray = file.split(','),
          binary = window.atob(imageDataArray[1]),
          array = new Uint8Array(binary.length),
          storageRef = firebase.storage().ref(),
          storagePath = storageDir + '/' + imgName + '.jpg',
          uploadTask = storageRef.child(storagePath);
      for( var i = 0; i < binary.length; i++ ) { 
        array[i] = binary.charCodeAt(i) 
      }
      var image = new Blob([array]);
      uploadTask.getDownloadURL()
      .then(function(url){// Ensure we're only storing one logo per school
        uploadTask.delete()
        .then(function(){
          var uploadTask = storageRef.child(storagePath).put(image);
          uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, {
            next: function(snapshot){
              var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                  console.log('Upload is paused');
                  break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                  console.log('Uploading ' + progress + "% complete");
                  break;
              }
            }, 
            error: function(error){
              switch (error.code) {
                 case 'storage/unauthorized':
                   console.log("You don't have permission to access this image");
                   break;

                 case 'storage/canceled':
                   console.log("Upload was canceled");
                   break;
              }
            },
            complete: function(){
              if(imgUse && imgUse === 'logo'){
                  school.logo = uploadTask.snapshot.downloadURL;
                  school.$save().then(function(){
                    cb();
                  });
              } else {
                storageRef.child(storagePath).getDownloadURL()
                .then(function(imgUrl){
                  cb(imgUrl); 
                })
                .catch(function(err){
                  console.log("Error: ", err);
                });  
              }
            }
          });
        }).catch(function(error){
          console.log(error);
        });
      }).catch(function(onReject){
        var uploadTask = storageRef.child(storagePath).put(image);
        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, {
          next: function(snapshot){
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            switch (snapshot.state) {
              case firebase.storage.TaskState.PAUSED: // or 'paused'
                break;
              case firebase.storage.TaskState.RUNNING: // or 'running'
                break;
            }
          }, 
          error: function(error){
            switch (error.code) {
               case 'storage/unauthorized':
                 break;
               case 'storage/canceled':
                 console.log("Upload was canceled");
                 break;
            }
          },
          complete: function(){
            if(imgUse && imgUse === 'logo'){
              school.logo = uploadTask.snapshot.downloadURL;
              school.$save().then(function(){
                cb();
              });
            } else {
              storageRef.child(storagePath).getDownloadURL()
              .then(function(imgUrl){
                cb(imgUrl); 
              })
              .catch(function(err){
                console.log("Error: ", err);
              });           
            } 
          }
        });
      });
    }
  }
}]);