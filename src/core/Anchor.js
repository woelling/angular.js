'use strict';

goog.require('angular.core.Block');

goog.provide('angular.core.Anchor');

/**
 * @interface
 */
angular.core.Anchor = function(){};

/**
 * @param {string=} type
 * @returns {angular.core.Block};
 */
angular.core.Anchor.newBlock = function(type){}

/**
 * @param {angular.core.Block} block
 */
angular.core.Anchor.addExisting = function(block){}
