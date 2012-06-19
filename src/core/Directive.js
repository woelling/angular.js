'use strict';

goog.require('angular.coreModule');

goog.provide('angular.core.Directive');

/**
 * @interface
 */
angular.core.Directive = function() {};

/**
 * @param {angular.core.Scope} scope
 */
angular.core.Directive.prototype.attach = function(scope){};

