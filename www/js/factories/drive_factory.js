Pta.service('Drive', [
  '$q',
  '$cacheFactory',
  'applicationId',
  '$cordovaOauthUtility',
  '$rootScope',
  function ($q, $cacheFactory, applicationId, $cordovaOauthUtility, $rootScope) {

    var googleApi = $rootScope.googleApi;
    var appScope = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file'];

    // Only fetch fields that we care about
    var DEFAULT_FIELDS = 'id,title,mimeType,userPermission,editable,copyable,shared,fileSize';

    var cache = $cacheFactory('files');

    /**
     * Combines metadata & content into a single object & caches the result
     *
     * @param {Object} metadata File metadata
     * @param {String} content File content
     * @return {Object} combined object
     */
    var combineAndStoreResults = function (metadata, content) {
      var file = {
        metadata: metadata,
        content: content
      };
      cache.put(metadata.id, file);
      return file;
    };


    /**
     * Check if the current token is valid (exists & not expired.)
     *
     * @return {Boolean} True if token still valid (not expired)
     */
    /*var isTokenValid = function () {
     var token = gapi.auth.getToken();
     return (token && Date.now() < token.expires_at);
     };*/

    /**
     * Attempt authorization.
     *
     * @param {Object} request Auth request
     * @return {Promise} promise that resolves on completion
     */

    this.authenticate = function (options, appScope) {
      /*
       * Sign into the Google service
       * @param    object options
       * @return   promise
       */

        var deferred = $q.defer();
        if (window.cordova) {
          var cordovaMetadata = cordova.require("cordova/plugin_list").metadata;
          if ($cordovaOauthUtility.isInAppBrowserInstalled(cordovaMetadata) === true) {
            var redirect_uri = "http://localhost/callback";
            if (options !== undefined) {
              if (options.hasOwnProperty("redirect_uri")) {
                redirect_uri = options.redirect_uri;
              }
            }
            var url = 'https://accounts.google.com/o/oauth2/auth?client_id=125323192420-c2nscbgoel9d0m7jv400dcfhfmtomac2.apps.googleusercontent.com&redirect_uri=' + redirect_uri + '&scope=' + appScope.join(" ") + '&approval_prompt=force&response_type=token';
            var browserRef = window.open(url, '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
            browserRef.addEventListener("loadstart", function (event) {
              if ((event.url).indexOf(redirect_uri) === 0) {
                browserRef.removeEventListener("exit", function (event) {
                });
                browserRef.close();
                var callbackResponse = (event.url).split("#")[1];
                var responseParameters = (callbackResponse).split("&");
                var parameterMap = [];
                for (var i = 0; i < responseParameters.length; i++) {
                  parameterMap[responseParameters[i].split("=")[0]] = responseParameters[i].split("=")[1];
                }
                if (parameterMap.access_token !== undefined && parameterMap.access_token !== null) {
                  deferred.resolve(parameterMap);
                  //deferred.resolve({ state : parameterMap.state,error : parameterMap.error, access_token: parameterMap.access_token, token_type: parameterMap.token_type, expires_in: parameterMap.expires_in });
                } else {
                  deferred.reject("Problem authenticating");
                }
              }
            });
            browserRef.addEventListener('exit', function (event) {
              deferred.reject("The sign in flow was canceled");
            });
          } else {
            deferred.reject("Could not find InAppBrowser plugin");
          }
        } else {
          deferred.reject("Cannot authenticate via a web browser");
        }

        return deferred.promise;
    };


    this.readFiles = function listFiles() {
      /*
       * Print files.
       **/

      var deffer = $q.defer();
      var request = gapi.client.drive.files.list();

      request.execute(function (resp) {
        var files = resp.files;
        var read_files = [];
        if (files && files.length > 0) {
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            read_files.push({name: file.title, id: file.id});
          }
          deffer.resolve(read_files);
        } else {
          deffer.reject("No files found");
          //appendPre('No files found.');
          console.log("No files found");
        }
      });
      return deffer.promise;
    };

    /**
     * Load a file from Drive. Fetches both the metadata & content in parallel.
     *
     * @param {String} fileID ID of the file to load
     * @return {Promise} promise that resolves to an object containing the file metadata & content
     */
    this.loadFile = function (fileId) {
      var file = cache.get(fileId);
      if (file) {
        return $q.when(file);
      }
      return googleApi.then(function (gapi) {
        var metadataRequest = gapi.client.drive.files.get({
          fileId: fileId,
          fields: DEFAULT_FIELDS
        });
        var contentRequest = gapi.client.drive.files.get({
          fileId: fileId,
          alt: 'media'
        });
        return $q.all([$q.when(metadataRequest), $q.when(contentRequest)]);
      }).then(function (responses) {
        return combineAndStoreResults(responses[0].result, responses[1].body);
      });
    };

    /**
     * Delete a file from Drive. Permanently deletes a file by ID. Skips the trash. The currently authenticated user must own the file.
     *
     * @param {String} fileID ID of the file to load
     * @return {Promise} promise that resolves to an object containing the file metadata & content
     */
    this.deleteFile = function (fileId) {
      var deffer = $q.defer();

      googleApi.then(function (gapi) {
        var deleteRequest = gapi.client.drive.files.delete({
          fileId: fileId
        });
        deleteRequest.execute(function (success) {
          deffer.resolve(success);
        }, function (error) {
          deffer.reject("File delete error: " + JSON.stringify(error));
        });
      });
      return deffer.promise;
    };
    /**
     * Update a file from Drive. Edit a file by ID. The currently authenticated user must own the file.
     *
     * @param {String} fileID ID of the file to edit
     * @return {Promise} promise that resolves to an object containing the file metadata & content
     */
    this.deleteFile = function (fileId) {
      var deffer = $q.defer();

      googleApi.then(function (gapi) {
        var deleteRequest = gapi.client.drive.files.delete({
          fileId: fileId
        });
        deleteRequest.execute(function (success) {
          deffer.resolve(success);
        }, function (error) {
          deffer.reject("File delete error: " + JSON.stringify(error));
        });
      });
      return deffer.promise;
    };

    /**
     * Save a file to Drive using the mutlipart upload protocol.
     *
     * @param {Object} metadata File metadata to save
     * @param {String} content File content
     * @return {Promise} promise that resolves to an object containing the current file metadata & content
     */
    this.saveFile = function (metadata, content) {
      return googleApi.then(function (gapi) {
        var path;
        var method;

        if (metadata.id) {
          path = '/upload/drive/v2/files/' + encodeURIComponent(metadata.id);
          method = 'PUT';
        } else {
          path = '/upload/drive/v2/files';
          method = 'POST';
        }

        var multipart = new MultiPartBuilder()
            .append('application/json', JSON.stringify(metadata))
            .append(metadata.mimeType, content)
            .finish();

        var uploadRequest = gapi.client.request({
          path: path,
          method: method,
          params: {
            uploadType: 'multipart',
            fields: DEFAULT_FIELDS
          },
          headers: {'Content-Type': multipart.type},
          body: multipart.body
        });
        return $q.when(uploadRequest);
      }).then(function (response) {
        return combineAndStoreResults(response.result, content);
      });
    };

    /**
     * Displays the Drive file picker configured for selecting text files
     *
     * @return {Promise} Promise that resolves with the ID of the selected file
     */
    this.showPicker = function (driveToken) {
      return googleApi
      .then(function (gapi) {
        var deferred = $q.defer();
        var view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('text/plain');
        var picker = new google.picker.PickerBuilder()
            .setAppId(applicationId)
            .setOAuthToken(driveToken)
            .addView(view)
            .setCallback(function (data) {
              if (data.action == 'picked') {
                var id = data.docs[0].id;
                deferred.resolve(id);
              } else if (data.action == 'cancel') {
                deferred.reject();
              }
            })
            .toUri();
            browserRef = window.open(picker, '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
        return deferred.promise;
      });
    };

    /**
     * Displays the Drive sharing dialog
     *
     * @param {String} id ID of the file to share
     */
    this.showSharing = function (id) {
      return googleApi.then(function (gapi) {
        //var deferred = $q.defer();
        var share = new gapi.drive.share.ShareClient(applicationId);
        share.setItemIds([id]);
        share.showSettingsDialog();
        //return deferred.promise;
      });
    };

  }]);