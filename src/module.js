'use strict';

goog.provide('angular.module');

goog.require('angular');

/**
 *
 * @param {string} name
 * @param {Array.<string|angular.Module>=} dependencies
 * @constructor
 */
angular.Module = function(name, dependencies) {
  var self = this;

  this.requires = dependencies || [];
  this.configures_ = [];
  this.values_ = [];
  this.factories_ = [];
  this.services_ = [];
  this.providers_ = [];
  this.runBlocks_ = [];

  this.$$configure = function($provide, $injector) {
    forEach(self.values_, invoke($provide, $provide.value));
    forEach(self.factories_, invoke($provide, $provide.factory));
    forEach(self.services_, invoke($provide, $provide.service));
    forEach(self.providers_, invoke($provide, $provide.provider));
    forEach(self.configures_, function(args) {
      var fn = $injector.invoke(args[0], args[1]);
      fn && self.runBlocks_.push(fn);
    });
    return ['$injector', function($injector) {
      forEach(self.runBlocks_, invoke($injector, $injector.invoke));
    }];
  };
  this.$$configure.$inject = ['$provide', '$injector'];
  this.$$configure.toString = function() {
    return "module '" + name + "'";
  };


  function invoke(self, fn) {
    return function(args) {
      return fn.apply(self, args);
    }
  }
};

/**
 * @param {angular.Injectable} configureFn
 * @return {angular.Module}
 */
angular.Module.prototype.config = function(configureFn) {
  this.configures_.push(arguments);
  return this;
};

/**
 * @param {angular.Injectable} runFn
 * @return {angular.Module}
 */
angular.Module.prototype.run = function(runFn) {
  this.runBlocks_.push(arguments);
  return this;
};

/**
 * @param {string|Object} name
 * @param {*=} value
 * @return {angular.Module}
 */
angular.Module.prototype.value = function(name, value) {
  this.values_.push(arguments);
  return this;
};

/**
 * @param {string|Object} name
 * @param {angular.Injectable=} factory
 * @param {boolean=} isPrivate
 * @return {angular.Module}
 */
angular.Module.prototype.factory = function(name, factory, isPrivate) {
  this.factories_.push(arguments);
  return this;
};

/**
 * @param {string|Object} name
 * @param {angular.Injectable=} Type
 * @param {boolean=} isPrivate
 * @return {angular.Module}
 */
angular.Module.prototype.service = function(name, Type, isPrivate) {
  this.services_.push(arguments);
  return this;
};

/**
 * @param {string|Object} name
 * @param {*=} Provider
 * @return {angular.Module}
 */
angular.Module.prototype.provider = function(name, Provider) {
  this.providers_.push(arguments);
  return this;
};

/**
 * @param {string} name
 * @param {Array.<string>=} dependencies
 * @param {angular.Injectable=} config
 * @return {angular.Module}
 */
angular.module = function(name, dependencies, config) {
  var module = new angular.Module(name, dependencies);
  if (config) {
    module.config(config);
  }

  angular.Module.modules[name] = module;
  return module;
};

angular.Module.modules = {};

// TODO(misko): temporary hack
angular.Module.prototype.controller = noop;
angular.Module.prototype.directive = noop;
angular.Module.prototype.filter = noop;
