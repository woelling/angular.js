'use strict';

goog.provide('angular.core.Block');

/**
 * @interface
 */
angular.core.Block = function() {};

/**
 * @param {angular.core.Block} block
 */
angular.core.Block.prototype.insertAfter = function(block) {};
