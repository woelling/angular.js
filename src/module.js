'use strict';

goog.provide('angular.module');
goog.provide('angular.Module');

goog.require('angular');

/**
 * The module class allows configuration of the services. The configuration
 * is then replayed to the injector during its configuration phase.
 *
 * @param {string} name
 * @param {Array.<string|angular.Module>=} dependencies
 * @constructor
 */
angular.Module = function(name, dependencies) {
  var self = this;

  /** @type {Array} */
  this.requires = dependencies || [];
  /** @type {Array} @private */
  this.configures_ = [];
  /** @type {Array} @private */
  this.values_ = [];
  /** @type {Array} @private */
  this.constants_ = [];
  /** @type {Array} @private */
  this.factories_ = [];
  /** @type {Array} @private */
  this.services_ = [];
  /** @type {Array} @private */
  this.providers_ = [];
  /** @type {Array} @private */
  this.runBlocks_ = [];

  /**
   * @provide {*} $provide
   * @provide {angular.Injector} $injector
   */
  this.$$configure = function($provide, $injector) {
    forEach(self.constants_, invoke($provide, $provide.value));
    forEach(self.values_, invoke($provide, $provide.value));
    forEach(self.factories_, invoke($provide, $provide.factory));
    forEach(self.services_, invoke($provide, $provide.service));
    forEach(self.providers_, invoke($provide, $provide.provider));
    forEach(self.configures_, function(args) {
      var fn = $injector.invoke(args[0], args[1]);
      fn && self.runBlocks_.push(fn);
    });
    return ['$injector', 
            /**
             * @param {angular.Injector}  $injector injector.
             */
            function($injector) {
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
 * @param {*=} value
 * @return {angular.Module}
 */
angular.Module.prototype.constant = function(name, value) {
  this.constants_.push(arguments);
  return this;
};

/**
 * @param {string|Object} name
 * @param {angular.Injectable=} factory
 * @param {boolean=} isPrivate
 * @return {angular.Module}
 */
angular.Module.prototype.factory = function(name, factory, isPrivate) {
  assertArg(name, 'name');
  if (isString(name)) {
    assertArg(factory, /** @type {string} */ (name));
  }
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

/**
 * @param {string} name
 * @param {angular.Injectable} Type
 * @param {boolean=} isPrivate
 * @returns {angular.Module}
 */
angular.Module.prototype.curry = function(name, Type, isPrivate) {
  this.factory(name, ['$injector', function($injector) {
    return $injector.curry(Type);
  }], isPrivate);
  return this;
};

/**
 * @param {string} name
 * @param {angular.Injectable} Type
 * @param {boolean=} isPrivate
 * @returns {angular.Module}
 */
angular.Module.prototype.curryTypeFactory = function(name, Type, isPrivate) {
  this.factory(name, ['$injector', function($injector) {
    var CurriedType = $injector.curry(Type);

    //TODO(misko): move this to $provider and use .apply
    return function(a, b, c, d, e, f, g, h, i, j) {
      if (arguments.length > 10) { throw Error('Too many arguments'); }
      return new CurriedType(a, b, c, d, e, f, g, h, i, j);
    };
  }], isPrivate);
  return this;
};


angular.Module.modules = {};


/**
 *
 * @param name
 * @param Directive
 * @returns {angular.Module}
 */
angular.Module.prototype.controller = function(name, Controller) {
  this.service('controller:' + name, Controller, true);
};

angular.Module.prototype.directive = function(name, Directive) {
  this.value('directive:' + name, Directive);
  return this;
};
angular.Module.prototype.filter = noop;

