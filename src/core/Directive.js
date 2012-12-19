'use strict';

goog.require('angular.coreModule');

goog.provide('angular.core.Directive');
goog.provide('angular.core.AccessorFactory');
goog.provide('angular.core.Accessor');

/**
 * @interface
 */
angular.core.Directive = function() {};

/**
 * @param {angular.core.Scope} scope
 */
angular.core.Directive.prototype.attach = function(scope){};



/**
 * @typedef {function(string):angular.core.Accessor}
 */
angular.core.AccessorFactory;



/**
 * When used with parameter then the accessor acts like setter, when
 * used without argument it is a getter.
 *
 * @typedef {function(*=):*}
 */
angular.core.Accessor;
