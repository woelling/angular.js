'use strict';

goog.provide('angular.core.Defer');
goog.provide('angular.core.Promise');
goog.provide('angular.core.PromiseCallback');
goog.provide('angular.core.Q');

/**
 * @interface
 */
angular.core.Q = function() {};

/**
 * @return {angular.core.Defer} .
 */
angular.core.Q.prototype.defer = function() {};

/**
 * @param {*} reason .
 * @return {angular.core.Promise} .
 */
angular.core.Q.prototype.reject = function(reason) {};

/**
 * @param {Array.<angular.core.Promise>} promises .
 * @return {angular.core.Promise} .
 */
angular.core.Q.prototype.all = function(promises) {};

/**
 * @param {angular.core.Promise|*} value .
 * @return {angular.core.Promise} .
 */
angular.core.Q.prototype.when = function(value) {};




/**
 * @interface
 */
angular.core.Promise = function() {};

/**
 * @template T
 * @param {angular.core.PromiseCallback.<T>} successCallback
 * @param {angular.core.PromiseCallback=} errorCallback
 * @return {angular.core.Promise.<T>}
 */
angular.core.Promise.prototype.then = function(successCallback, errorCallback) {};


/**
 * @interface
 */
angular.core.Defer = function() {};

/**
 * @template T
 * @type {angular.core.Promise.<T>}
 */
angular.core.Defer.prototype.promise;

/**
 * @param {*} value .
 */
angular.core.Defer.prototype.resolve = function(value) {};

/**
 * @param {*} reason .
 */
angular.core.Defer.prototype.reject = function(reason) {};

/**
 * @typedef {function(?):?}
 */
angular.core.PromiseCallback;
