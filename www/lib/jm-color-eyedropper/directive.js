angular.module('jmColorEyedropper', [])
  .directive('jmEyedropperCanvas', function () {
    "use strict";

    function resample_hermite(canvas, W, H, W2, H2) {
      // resample code based on code from SO: http://stackoverflow.com/a/19223362/680786 (thanks, @ViliusL)
      var time1 = Date.now();
      var img = canvas.getContext("2d").getImageData(0, 0, W, H);
      var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
      var data = img.data;
      var data2 = img2.data;
      var ratio_w = W/W2;
      var ratio_h = H/H2;
      var ratio_w_half = Math.ceil(ratio_w/2);
      var ratio_h_half = Math.ceil(ratio_h/2);

      for (var j = 0; j < H2; j++) {
        for (var i = 0; i < W2; i++) {
          var x2 = (i + j*W2)*4;
          var weight = 0;
          var weights = 0;
          var weights_alpha = 0;
          var gx_r, gx_g, gx_b, gx_a;
          gx_r = gx_g = gx_b = gx_a = 0;
          var center_y = (j + 0.5)*ratio_h;
          for (var yy = Math.floor(j*ratio_h); yy < (j + 1)*ratio_h; yy++) {
            var dy = Math.abs(center_y - (yy + 0.5))/ratio_h_half;
            var center_x = (i + 0.5)*ratio_w;
            var w0 = dy*dy; //pre-calc part of w
            for (var xx = Math.floor(i*ratio_w); xx < (i + 1)*ratio_w; xx++) {
              var dx = Math.abs(center_x - (xx + 0.5))/ratio_w_half;
              var w = Math.sqrt(w0 + dx*dx);
              if (w >= -1 && w <= 1) {
                //hermite filter
                weight = 2*w*w*w - 3*w*w + 1;
                if (weight > 0) {
                  dx = 4*(xx + yy*W);
                  //alpha
                  gx_a += weight*data[dx + 3];
                  weights_alpha += weight;
                  //colors
                  if (data[dx + 3] < 255) {
                    weight = weight*data[dx + 3]/250;
                  }
                  gx_r += weight*data[dx];
                  gx_g += weight*data[dx + 1];
                  gx_b += weight*data[dx + 2];
                  weights += weight;
                }
              }
            }
          }
          data2[x2] = gx_r/weights;
          data2[x2 + 1] = gx_g/weights;
          data2[x2 + 2] = gx_b/weights;
          data2[x2 + 3] = gx_a/weights_alpha;
        }
      }
      canvas.getContext("2d").clearRect(0, 0, Math.max(W, W2), Math.max(H, H2));
      canvas.width = W2;
      canvas.height = H2;
      canvas.getContext("2d").putImageData(img2, 0, 0);
    }

    function findPos(obj) {
      // thanks, @lwburk http://stackoverflow.com/a/6736135
      var curleft = 0, curtop = 0;
      if (obj.offsetParent) {
        do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
        } while ((obj = obj.offsetParent));
        return {x: curleft, y: curtop};
      }
      return undefined;
    }

    var directiveDefinitionObject = {
      restrict: 'EAC',
      replace:  true,
      template: '<canvas width="{{width}}" height="{{height}}"></canvas>',
      scope:    {
        imgSrc:   '@',
        width:    '@',
        height:   '@',
        ngModel:  '=',
        ngChange: '&'
      },
      link:     function (scope, element, attrs) {
        attrs.$observe('imgSrc', function (src) {
          if (!src || src === undefined || src === null) {
            return false;
          }
          var canvas = element[0];
          var ctx = canvas.getContext("2d");
          var img = new Image();
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resample_hermite(canvas, img.width, img.height, scope.width, scope.height);
          };
          img.src = src;
        });
        element.click(function (e) {
          var pos = findPos(this);
          var x = e.pageX - pos.x;
          var y = e.pageY - pos.y;
          var coord = "x=" + x + ", y=" + y;
          var c = this.getContext('2d');
          var p = c.getImageData(x, y, 1, 1).data;
          scope.$apply(function () {
            scope.ngModel = p;
          });
          scope.$apply(function () {
            if (angular.isFunction(scope.ngChange)) {
              scope.ngChange(p);
            }
          });
        });
      }
    };
    return directiveDefinitionObject;
  });