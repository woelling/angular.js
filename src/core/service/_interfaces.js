'use strict';

goog.provide('angular.core.ElementWrapper');
goog.provide('angular.core.Directive');

/**
 * This interface is used by angular.core.Block as well as angular.core.BlockList. This is so that we can treat a anchor
 * as something which we can add blocks after.
 *
 * @interface
 */
angular.core.ElementWrapper = function() {};

/**
 * Prorperty which designates the elements which the object is wrapping. It is a public property which will be used
 * for adding new blocks after.
 *
 * @type {angular.core.NodeList}
 */
angular.core.ElementWrapper.prototype.elements;

/**
 * @type {angular.core.ElementWrapper}
 */
angular.core.ElementWrapper.prototype.next;

/**
 * @type {angular.core.ElementWrapper}
 */
angular.core.ElementWrapper.prototype.previous;








/**
 * @interface
 */
angular.core.Directive = function() {};

/**
 * @param {angular.core.Scope} scope
 */
angular.core.Directive.prototype.attach = function(scope){};


