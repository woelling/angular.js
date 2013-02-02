'use strict';

goog.provide('angular.core.Scope');

/**
 * @interface
 */
angular.core.Scope = function(){};

/**
 * @template T
 * @param {string|function(angular.core.Scope):T} watchfn
 * @param {function(T, T, angular.core.Scope)=} reactionFn
 * @returns {function()}
 */
angular.core.Scope.prototype.$watch = function(watchfn, reactionFn) {};


/**
 * @param {(string|Function)} fn
 */
angular.core.Scope.prototype.$evalAsync = function(fn) {};

/**
 * @param {(string|Function)} fn
 * @returns {*}
 */
angular.core.Scope.prototype.$eval = function(fn) {};

/**
 * @template T
 * @param {(string|function():T)=} fn
 * @returns {T}
 */
angular.core.Scope.prototype.$apply = function(fn) {};


/**
 * @param {boolean=} isolate
 * @returns {angular.core.Scope}
 */
angular.core.Scope.prototype.$new = function(isolate) {};


angular.core.Scope.prototype.$destroy = function() {};
