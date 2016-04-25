/*
 * angular-google-picker
 *
 * Interact with the Google API Picker
 * More information about the Google API can be found at https://developers.google.com/picker/
 *
 * (c) 2014 Loic Kartono
 * License: MIT
 */
(function () {
  angular.module('lk-google-picker', [])

  .provider('lkGoogleSettings', function () {
    this.apiKey   = 'AIzaSyB8pW24K8TWAKiP5XQHDlTNyBjjfR11wM0';
    this.clientId = '935811502625-aq8j2t6beni45crvbt3fvu59sgsgu5in.apps.googleusercontent.com'
    // android '935811502625-rhdtv4di319pd1dso92bpqoqormb3o9q.apps.googleusercontent.com';
    this.clientSecret = 'KYThpRieWjatEr6ILzofhXS_';
    this.scopes   = ['https://www.googleapis.com/auth/drive'];
    this.features = ['MULTISELECT_ENABLED'];
    this.redirectUri = 'http://localhost';
    this.views    = ['DocsView().setIncludeFolders(true)', 'DocsUploadView().setIncludeFolders(true)'];
    this.locale   = 'en'; // Default to English

    /**
     * Provider factory $get method
     * Return Google Picker API settings
     */
    this.$get = ['$window', function ($window) {
      return {
        apiKey   : this.apiKey,
        clientId : this.clientId,
        scopes   : this.scopes,
        features : this.features,
        views    : this.views,
        locale   : this.locale,
        origin   : this.origin || $window.location.protocol + '//' + $window.location.host
      }
    }];

    /**
     * Set the API config params using a hash
     */
    this.configure = function (config) {
      for (var key in config) {
        this[key] = config[key];
      }
    };
  })

  .directive('lkGooglePicker', [
    'lkGoogleSettings', 
    '$q', 
    '$httpParamSerializer', 
    '$cordovaInAppBrowser',
    function (lkGoogleSettings, $q, $httpParamSerializer, $cordovaInAppBrowser) {
    return {
      restrict: 'A',
      scope: {
        onLoaded: '&',
        onCancel: '&',
        onPicked: '&'
      },
      link: function (scope, element, attrs) {
        var accessToken = null;

        //Extends gapi with authorization method
        function authorize () {
            var deferred = $q.defer();

            //Build the OAuth consent page URL
            var authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=1027095558281-cmq64mbpfukfggs0m8vbp2gt70ugcnqk.apps.googleusercontent.com&redirect_uri=http://localhost&response_type=code&scope=https://www.googleapis.com/auth/drive';
                

            //Open the OAuth consent page in the InAppBrowser
            var appBrowserOpts = {
              location: 'no',
              toolbar: 'no',
              hardwareback: 'no'
            }
            var authWindow = $cordovaInAppBrowser.open(authUrl, '_blank', appBrowserOpts);

            //Run on the window load event
            authWindow.addEventListiner('$cordovaInAppBrowser:loadstart', function(e) {

                var url = e.originalEvent.url;
                var code = /\?code=(.+)$/.exec(url);
                var error = /\?error=(.+)$/.exec(url);

                if (code || error) {
                    //Always close the browser when match is found
                    scope.authWindow.close();
                }

                if (code) {
                    //Exchange the authorization code for an access token
                    $http.post('https://accounts.google.com/o/oauth2/token', {
                        code: code[1],
                        client_id: lkGoogleSettings.clientId,
                        // client_secret: lkGoogleSettings.clientSecret,
                        redirect_uri: lkGoogleSettings.redirectUri,
                        grant_type: 'authorization_code'
                    }).then(function(data) {
                        deferred.resolve(data);
                    }).then(function(response) {
                        deferred.reject(response.responseJSON);
                    });
                } else if (error) {
                    //The user denied access to the app
                    deferred.reject({
                        error: error[1]
                    });
                }
            });

            return deferred.promise;
        }

        /**
         * Load required modules
         */
        function instanciate () {
          gapi.load('auth', { 'callback': onApiAuthLoad });
          gapi.load('picker');
        }

        /**
         * OAuth autorization
         * If user is already logged in, then open the Picker modal
         */
        function onApiAuthLoad () {
          var authToken = gapi.auth.getToken();

          if (authToken) {
            handleAuthResult(authToken);
          } else {
            authorize()
            .then(function(data) {
                console.log('Access Token: ' + data.access_token);
            }).catch(function(data) {
                console.log(data.error);
            });
          }
        }

        /**
         * Google API OAuth response
         */
        function handleAuthResult (result) {
          if (result && !result.error) {
            accessToken = result.access_token;
            openDialog();
          }
        }

        /**
         * Everything is good, open the files picker
         */
        function openDialog () {
          var picker = new google.picker.PickerBuilder()
                                 .setLocale(lkGoogleSettings.locale)
                                 .setOAuthToken(accessToken)
                                 .setCallback(pickerResponse)
                                 .setOrigin(lkGoogleSettings.origin);

          if (lkGoogleSettings.features.length > 0) {
            angular.forEach(lkGoogleSettings.features, function (feature, key) {
              picker.enableFeature(google.picker.Feature[feature]);
            });
          }

          if (lkGoogleSettings.views.length > 0) {
            angular.forEach(lkGoogleSettings.views, function (view, key) {
              view = eval('new google.picker.' + view);
              picker.addView(view);
            });
          }

          picker.build().setVisible(true);
        }

        /**
         * Callback invoked when interacting with the Picker
         * data: Object returned by the API
         */
        function pickerResponse (data) {
          gapi.client.load('drive', 'v2', function () {
            if (data.action == google.picker.Action.LOADED && scope.onLoaded) {
              (scope.onLoaded || angular.noop)();
            }
            if (data.action == google.picker.Action.CANCEL && scope.onCancel) {
              (scope.onCancel || angular.noop)();
            }
            if (data.action == google.picker.Action.PICKED && scope.onPicked) {
              (scope.onPicked || angular.noop)({docs: data.docs});
            }
            scope.$apply();
          });
        }

        gapi.load('auth');
        gapi.load('picker');

        element.bind('click', function (e) {
          instanciate();
        });
      }
    }
  }]);
})();
