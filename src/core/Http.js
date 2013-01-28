'use strict';

goog.provide('angular.core.Http');

goog.require('angular.core.Promise');


/**
 * @interface
 */
angular.core.Http = function() {};

/**
 * @param {string} url
 * @param {angular.core.HttpConfig} config
 * @return {angular.core.HttpPromise}
 */
angular.core.Http.prototype.get = function(url, config) {};



/**
 * @typedef {
 *  Object
 * }
 */
angular.core.HttpConfig;


/**
 * @interface
 * @extends angular.core.Promise
 */
angular.core.HttpPromise = function() {};

/**
 * @template T
 * @param {angular.core.PromiseCallback} successCallback
 * @param {angular.core.PromiseCallback=} errorCallback
 * @return {angular.core.Promise.<T>}
 */
angular.core.HttpPromise.prototype.success = function(successCallback, errorCallback) {};



/**
 * @typedef {{
 *   method: (string|undefined),
 *   url: (string|undefined),
 *   params: (Object.<string, string|Object>|undefined),
 *   data:  (Object|string|undefined),
 *   headers: (Object|undefined),
 *   transformRequest: (Function|undefined),
 *   transformResponse: (Function|undefined),
 *   cache: (angular.core.Cache|boolean|undefined),
 *   timeout: (number|undefined),
 *   withCredentials: (boolean|undefined)
 * }}
 */
angular.core.HttpConfig;
