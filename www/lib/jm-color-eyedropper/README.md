angular-color-eyedropper
========================

##Install

`bower install jm-color-eyedropper`

##Use

0. Install it;
1. Add `jmColorEyedropper` to your angular module dependencies list;
2. Declare `<jm-eyedropper-canvas>` element in HTML.


This canvas will load image from `img-src` attribute, scale size of image to width/height of canvas (from `width` and `height` attributes) and will set `ng-model` to color data of pixel on mouseclick event. If `ng-change` declared, will be triggered also.


