'use strict';

goog.require('angular.coreModule');
goog.require('angular.core.Anchor');

goog.provide('angular.core.$Anchor');

angular.coreModule.factory('$Anchor', ['$rootScope', function($rootScope) {
  /**
   *
   * @param elements
   * @param templates
   * @constructor
   * @implements {angular.core.Anchor}
   */
  var Anchor = function (elements, templates) {
    this.elements = elements;
    this.next = this.previous = null;
    this.templates = isFunction(templates) ? {'': templates} : templates;

    var existing = this.existing = [];

    ASSERT(elements && elements.length);

    // This is a bit of a hack.
    // We need to run after the first watch, that means we have to wait for watch, and then schedule $evalAsync.
    var deregisterWatch = $rootScope.$watch(function() {
      deregisterWatch();
      $rootScope.$evalAsync(function() {
        while(existing.length) {
          existing.shift().remove();
        }
      });
    });
  };

  Anchor.prototype = {
    /**
     * @param {angular.core.Block} block
     */
    addExisting: function(block) {
      this.existing.push(block);
    },

    /**
     * @param {string=} type
     * @return {angular.core.Block}
     */
    newBlock: function(type) {
      var template;

      if (this.existing.length) {
        return this.existing.shift();
      } else {
        template = this.templates[type || ''];
        template = template && template();
      }
      return template;
    }
  };

  return Anchor;
}]);

