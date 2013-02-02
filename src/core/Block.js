'use strict';

goog.provide('angular.core.Block');

/**
 * @interface
 */
angular.core.Block = function() {};

/**
 * @param {angular.core.Anchor|angular.core.Block} block
 */
angular.core.Block.prototype.insertAfter = function(block) {};
/**
 * @param {angular.core.Anchor|angular.core.Block} block
 */
angular.core.Block.prototype.moveAfter = function(block) {};

angular.core.Block.prototype.remove = function() {};

/**
 * @param {angular.core.Scope} scope
 */
angular.core.Block.prototype.attach = function(scope){};

/** @type {angular.core.Block} */
angular.core.Block.prototype.next;
/** @type {angular.core.Block} */
angular.core.Block.prototype.previous;
