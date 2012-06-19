'use strict';

goog.require('angular.coreModule');

goog.provide('angular.core.$document');

angular.coreModule.provider('$document', $DocumentProvider);

/**
 * @ngdoc object
 * @name ng.$document
 * @requires $window
 *
 * @description
 * A {@link angular.element jQuery (lite)}-wrapped reference to the browser's `window.document`
 * element.
 */
function $DocumentProvider(){
  this.$get = ['$window', function(window){
    return jqLite(window.document);
  }];
}
