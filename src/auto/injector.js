'use strict';

goog.provide('angular.injector');
goog.provide('angular.Injector');
goog.provide('angular.Injectable');
goog.provide('angular.Provide');

goog.require('angular.HashMap');


/** @typedef {function(string, angular.Injector):*} */
angular.LocalFactoryFn;

/**
 * @interface
 */
angular.Injector = function angular_Injector() {};
angular.Injector.__ASSERT__ = function(injector) {
  return injector && injector.constructor.name.indexOf('Injector') > -1;
};

angular.Injector.notImplemented = function() {
  throw Error('NOT IMPLEMENTED');
};

/**
 * @template T
 * Get a service.
 * @param {string} name service name to return.
 * @param {Function=} contextFn Function which is requesting the
 *    injection. Used for debugging purposes.
 * @return {T} .
 */
angular.Injector.prototype.get = function(name, contextFn) {};

/**
 * Invoke a method.
 * @param {angular.Injectable} injectableFn method to invoke.
 * @param {Object=} self The 'this' for the method.
 * @return {*} return value of the invoked method.
 */
angular.Injector.prototype.invoke = function(injectableFn, self) {};

/**
 * @param {Object.<*>} locals .
 * @param {angular.LocalFactoryFn} factoryFn .
 * @return {angular.Injector} return value of the invoked method.
 */
angular.Injector.prototype.locals = function(locals, factoryFn) {};

/**
 * Instantiate type.
 * @param {angular.Injectable} injectableFn Type to instantiate.
 * @return {Object} The type instance.
 */
angular.Injector.prototype.instantiate = function(injectableFn) {};

/**
 * @typedef { Function|Array.<string|Function> }
 */
angular.Injectable;

/**
 * @interface
 */
angular.Provider = function() {};

/** @type angular.Injectable */
angular.Provider.prototype.$get = function() {};



var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function annotate(fn) {
  var $inject,
      fnText,
      argDecl,
      last;

  if (typeof fn == 'function') {
    if (!($inject = fn.$inject)) {
      $inject = [];
      fnText = fn.toString().replace(STRIP_COMMENTS, '');
      argDecl = fnText.match(FN_ARGS);
      forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg) {
        arg.replace(FN_ARG, function(all, underscore, name) {
          $inject.push(name);
        });
      });
      fn.$inject = $inject;
    }
  } else if (isArray(fn)) {
    last = fn.length - 1;
    assertArgFn(fn[last], 'fn');
    $inject = fn.slice(0, last);
  } else {
    assertArgFn(fn, 'fn', true);
  }
  return $inject;
}

/**
 * @ngdoc function
 * @name angular.injector
 * @function
 *
 * @description
 * Creates an injector that can be used for retrieving services as well as for
 * dependency injection (see {@link guide/di dependency injection}).
 *

 * @param {Array.<string|Function>=} modulesToLoad A list of module functions or their aliases. See
 *        {@link angular.module}. The `ng` module must be explicitly added.
 * @returns {angular.Injector} Injector an injector. See {@link AUTO.$injector $injector}.
 *
 * @example
 * Typical usage
 * <pre>
 *   // create an injector
 *   var $injector = angular.injector(['ng']);
 *
 *   // use the injector to kick off your application
 *   // use the type inference to auto inject arguments, or use implicit injection
 *   $injector.invoke(function($rootScope, $compile, $document){
 *     $compile($document)($rootScope);
 *     $rootScope.$digest();
 *   });
 * </pre>
 */

function createInjector(modulesToLoad) {
  var PROVIDER_SUFFIX = 'Provider';
  var path = [];
  var pathHash = {}

  function pathPush(name, contextFunction) {
    VAR(name).is(String);
    VAR(contextFunction).is(angular.annotate.Info, undefined);
    ASSERT_EQ(2 * Math.floor(path.length / 2), path.length);

    if (pathHash[name]) {
      angular.Injector.error(path, 'Circular dependency');
    }
    pathHash[name] = true;
    path.push(name);
    path.push(contextFunction);
  }

  function pathPop() {
    path.pop();
    pathHash[path.pop()] = false;
  }

  /**
   * @ngdoc object
   * @name AUTO.$injector
   * @function
   *
   * @description
   *
   * `$injector` is used to retrieve object instances as defined by {@link AUTO.$provide provider},
   * instantiate types, invoke methods, and load sub-modules.
   *
   * The following always holds true:
   *
   * <pre>
   *   var $injector = angular.injector();
   *   expect($injector.get('$injector')).toBe($injector);
   *   expect($injector.invoke(function($injector){
   *     return $injector;
   *   }).toBe($injector);
   * </pre>
   *
   * # Injection Function Annotation
   *
   * JavaScript does not have annotations, and annotations are needed for dependency injection. The
   * following ways are all valid way of annotating function with injection arguments and are
   * equivalent.
   *
   * <pre>
   *   // inferred (only works if code not minified/obfuscated)
   *   $inject.invoke(function(serviceA){});
   *
   *   // annotated
   *   function explicit(serviceA) {};
   *   explicit.$inject = ['serviceA'];
   *   $inject.invoke(explicit);
   *
   *   // inline
   *   $inject.invoke(['serviceA', function(serviceA){}]);
   * </pre>
   *
   * ## Inference
   *
   * In JavaScript calling `toString()` on a function returns the function definition. The
   * definition can then be parsed and the function arguments can be extracted. *NOTE:* This does
   * not work with minification, and obfuscation tools since these tools change the argument names.
   *
   * ## `$inject` Annotation
   * By adding a `$inject` property onto a function the injection parameters can be specified.
   * (This is minification safe)
   *
   * ## Inline
   * As an array of injection names, where the last item in the array is the function to call.
   * (This is minification safe)
   *
   * @constructor
   * @implements angular.Injector
   */
  function Injector(parent) {
    this.$$parent = parent;

    /** @constructor */
    function Instance() {}
    Instance.prototype = parent.$$instances;
    this.$$instances = new Instance();

    /** @constructor */
    function Providers() {}
    Providers.prototype = parent.$$providers;
    this.$$providers = new Providers();

    /** @constructor */
    function ModuleMap() {}
    ModuleMap.prototype = parent.$$modules;
    this.$$modules = new ModuleMap();

    this.$$instances['$injector'] = [this];
  }

  extend(Injector.prototype, /** @lends {Injector.prototype} */ ({
    /**
     * @ngdoc method
     * @name AUTO.$injector#get
     * @methodOf AUTO.$injector
     *
     * @description
     * Return an instance of the service.
     *
     * @param {string} name The name of the instance to retrieve.
     * @param {Function=} contextFn Function which is requesting the
     *    injection. Used for debugging purposes.
     * @return {*} The instance.
     *
     * <pre>
     *   angular.module('myModule').
     *     value('salutation', 'Hello');
     *
     *   var injector = angular.injector(['myModule']);
     *   expect(injector.get('salutation')).toEqual('Hello');
     * </pre>
     */
    get: function(name, contextFn) {
      var instances = this.$$instances,
          instance = instances[name],
          provider;

      if (instance instanceof Array) {
        if (!instance[1] /* private */ || instances.hasOwnProperty(name)) {
          // you can only return a hit if not private or defined in this injector
          return instance[0];
        }
      }

      provider = this.$$providers[name + PROVIDER_SUFFIX];
      if (provider instanceof Array) {
        provider = provider[0];
        if (provider.$private || this.$$providers.hasOwnProperty(name + PROVIDER_SUFFIX)) {
          pathPush(name, contextFn);
          try {
            instance = this.invoke(provider.$get, provider);
            instances[name] = [instance, provider.$private];
            return instance;
          } finally {
            pathPop();
          }
        }
      }

      return this.$$parent.get(name, contextFn);
    },

    /**
     *
     * @param {angular.Injectable} fn
     * @return {Array}
     */
    getFnArgs: function(fn) {
      var $inject = annotate(fn),
          i = 0, ii = $inject.length,
          nakedFn = fn.$inject == $inject ? fn : fn[ii],
          args = [nakedFn];

      for(; i < ii; i++) {
        args.push(this.get($inject[i], nakedFn));
      }

      return args;
    },

    /**
     * @ngdoc method
     * @name AUTO.$injector#enumerate
     * @methodOf AUTO.$injector
     *
     * @description
     * Return a list of all visible services.
     *
     * @return {Array.<string>} The instance.
     *
     * <pre>
     *   angular.module('myModule').
     *     value('salutation', 'Hello');
     *
     *   var injector = angular.injector(['myModule']);
     *   expect(injector.enumerate).toEqual(['salutation']);
     * </pre>
     */
    enumerate: function() {
      var list = this.$$parent.enumerate();

      forEach(this.$$providers, function(provider, name) {
        list.push(name.substr(0, name.length - PROVIDER_SUFFIX.length));
      });

      list.sort();
      return list;
    },

    /**
     * @ngdoc method
     * @name AUTO.$injector#invoke
     * @methodOf AUTO.$injector
     * @override
     *
     * @description
     * Invoke the method and supply the method arguments from the `$injector`.
     *
     * @param {angular.Injectable} fn The function to invoke. The function
     * arguments come form the function annotation.
     * @param {Object=} self The `this` for the invoked method.
     * @returns {*} the value returned by the invoked `fn` function.
     *
     *
     * <pre>
     *   angular.module('myModule').
     *     value('salutation', 'Hello');
     *
     *   var injector = angular.injector(['myModule']);
     *   injector.invoke(function(salutation) {
     *     expect(salutation).toEqual('Hello');
     *   });
     * </pre>
     */
    invoke: function invoke(fn, self){
      var args = this.getFnArgs(fn),
          $inject = annotate(fn),
          i, ii;

      return args.shift().apply(self, args)
    },


    /**
     * @ngdoc method
     * @name AUTO.$injector#instantiate
     * @methodOf AUTO.$injector
     * @description
     * Create a new instance of JS type. The method takes a constructor function invokes the new
     * operator and supplies all of the arguments to the constructor function as specified by the
     * constructor annotation.
     *
     * @param {angular.Injectable} Type Annotated constructor function.
     * @returns {Object} new instance of `Type`.
     *
     *
     * <pre>
     *   function Greeter(salutation) {
     *     this.salutation = salutation;
     *
     *     this.greet = function(subject) {
     *       return this.salutation + ' ' + subject + '!';
     *     }
     *   }
     *
     *   angular.module('myModule').
     *     value('salutation', 'Hello');
     *
     *   var injector = angular.injector(['myModule']);
     *   var greeter = injector.instantiate(Greeter);
     *
     *   expect(greeter.salutation).toEqual('Hello');
     *   expect(greeter.greet('World')).toEqual('Hello World!');
     * </pre>
     */
    instantiate: function(Type) {
      /** @constructor */
      var Constructor = function() {};
      var instance, returnedValue;

      Constructor.prototype = (isArray(Type) ? Type[Type.length - 1] : Type).prototype;
      instance = new Constructor();
      returnedValue = /** @type Object */ (this.invoke(Type, instance));

      return isObject(returnedValue) ? returnedValue : instance;
    },

    /**
     * Create a new function which curries some of the parameters to the original delegate function. The resulting
     * function can be used as constructor function or just as direct call.
     *
     * <pre>
     * // Give
     * var MyType = function(a, b) {
     *   this.a = a;
     *   this.b = b;
     * }
     * MyType.$inject = ['a'];
     *
     * // when
     * expect(injector.get('a')).toEqual('A');
     *
     * // then
     * var MyTypeCurried = injector.curry(MyType);
     * var myType = new MyTypeCurried('B');
     *
     * expect(myType.a).toEqual('A');
     * expect(myType.b).toEqual('B');
     * </pre>
     *
     * @param {angular.Injectable} delegate The function which will have some of its values curried.
     *   The values which are bound are determined by the standard injection annotation such as $inject.
     * @return {Function} A new function which has some of the delegate function paramaters bound.
     */
    curry: function(delegate) {
      var injector = this;
      var curryArgs = this.getFnArgs(delegate);
      var curriedFn = function() {
        var args = curryArgs.concat(slice.call(arguments, 0));
        var isConstructorInvocation = this instanceof curriedFn;
        var returnValue = args.shift().apply(this, args);

        return returnValue == undefined && this instanceof curriedFn ? this : returnValue;
      };

      curriedFn.prototype = (isArray(delegate) ? delegate[delegate.length - 1] : delegate).prototype;
      return curriedFn;
    },


    /**
     * @ngdoc method
     * @name AUTO.$injector#annotate
     * @methodOf AUTO.$injector
     *
     * @description
     * Returns an array of service names which the function is requesting for injection. This API is
     * used by the injector to determine which services need to be injected into the function when
     * the function is invoked. There are three ways in which the function can be annotated with the
     * needed dependencies.
     *
     * # Argument names
     *
     * The simplest form is to extract the dependencies from the arguments of the function. This is
     * done by converting the function into a string using `toString()` method and extracting the
     * argument names.
     * <pre>
     *   // Given
     *   function MyController($scope, $route) {
     *     // ...
     *   }
     *
     *   // Then
     *   expect(injector.annotate(MyController)).toEqual(['$scope', '$route']);
     * </pre>
     *
     * This method does not work with code minfication / obfuscation. For this reason the following
     * annotation strategies are supported.
     *
     * # The `$injector` property
     *
     * If a function has an `$inject` property and its value is an array of strings, then the
     * strings represent names of services to be injected into the function.
     * <pre>
     *   // Given
     *   var MyController = function(obfuscatedScope, obfuscatedRoute) {
     *     // ...
     *   }
     *   // Define function dependencies
     *   MyController.$inject = ['$scope', '$route'];
     *
     *   // Then
     *   expect(injector.annotate(MyController)).toEqual(['$scope', '$route']);
     * </pre>
     *
     * # The array notation
     *
     * It is often desirable to inline Injected functions and that's when setting the `$inject`
     * property is very inconvenient. In these situations using the array notation to specify the
     * dependencies in a way that survives minification is a better choice:
     *
     * <pre>
     *   // We wish to write this (not minification / obfuscation safe)
     *   injector.invoke(function($compile, $rootScope) {
     *     // ...
     *   });
     *
     *   // We are forced to write break inlining
     *   var tmpFn = function(obfuscatedCompile, obfuscatedRootScope) {
     *     // ...
     *   };
     *   tmpFn.$inject = ['$compile', '$rootScope'];
     *   injector.invoke(tempFn);
     *
     *   // To better support inline function the inline annotation is supported
     *   injector.invoke(['$compile', '$rootScope', function(obfCompile, obfRootScope) {
     *     // ...
     *   }]);
     *
     *   // Therefore
     *   expect(injector.annotate(
     *      ['$compile', '$rootScope', function(obfus_$compile, obfus_$rootScope) {}])
     *    ).toEqual(['$compile', '$rootScope']);
     * </pre>
     *
     * @param {Function|Array.<string|Function>} fn Function for which dependent service names need
     *   to be retrieved as described above.
     *
     * @returns {Array.<string>} The names of the services which the function requires.
     */
    annotate: annotate,

    /**
     * @ngdoc method
     * @name AUTO.$injector#load
     * @methodOf AUTO.$injector
     *
     * @description
     * Create a child injector from a module definition. It is useful for loading modules (and the
     * associated code) lazily into the browser.
     *
     * @param {Array.<string|Function>=} modules A list of module functions or their aliases. See
     *        {@link angular.module}. The `ng` module must be explicitly added.
     * @returns {angular.Injector} Injector an injector. See {@link AUTO.$injector $injector}.
     *
     * <pre>
     *  angular.module('root').
     *    value('answer', 42);
     *
     *  var rootInjector = angular.inejector(['root']);
     *  expect(rootInjector.get('answer')).toEqual(42);
     *
     *  angular.module('child').
     *    value('answer', -42).
     *    value('greeting', 'hello');
     *
     *  var childInjector = rootInjector.load(['child']);
     *  expect(rootInjector.get('answer')).toEqual(42);
     *  expect(childInjector.get('answer')).toEqual(-42);
     *  expect(rootInjector.get('greeting')).toEqual('hello');
     * </pre>
     */
    load: function(modules) {
      var injector = new Injector(this),
          loadedModules = injector.$$modules,
          providerInjector = new ProviderInjector(injector);

      forEach(loadModules(modules), function(fn) { injector.invoke(fn || noop); });
      return injector;

      ///////////////////////////////////////////

      function loadModules(modulesToLoad){
        var runBlocks = [];
        forEach(modulesToLoad, function(module) {
          if (loadedModules.get(module)) return;
          loadedModules.put(module, true);

          if (isString(module)) {
            if (angular.Module.modules.hasOwnProperty(module)) {
              module = angular.Module.modules[module];
            } else {
              throw Error('No module: ' + module);
            }
          }

          if (module.requires) {
            runBlocks = runBlocks.concat(loadModules(module.requires));
          }

          if (module.$$configure) {
            module = module.$$configure;
          }

          if (isFunction(module)) {
            try {
              runBlocks.push(providerInjector.invoke(module));
            } catch (e) {
              if (e.message) e.message += ' from ' + module;
              throw e;
            }
          } else if (isArray(module)) {
            try {
              runBlocks.push(providerInjector.invoke(module));
            } catch (e) {
              if (e.message) e.message += ' from ' + String(module[module.length - 1]);
              throw e;
            }
          } else {
            assertArgFn(module, 'module');
          }
        });
        return runBlocks;
      }
    },

    /**
     * @ngdoc method
     * @name AUTO.$injector#locals
     * @methodOf AUTO.$injector
     *
     * @description
     * Create a child injector which contains a set of value constants known as local variables.
     *
     * <pre>
     * </pre>
     *
     * @param {Object} locals
     * @param {function(string, angular.Injector)=} resolveFn A function which gets a chance to resolve a service. It
     *        is called if the locals do not contain the service. Return `undefined` if the
     *        service can not be resolved and the request should be delegated to the parent injector.
     * @returns {LocalsInjector} Injector an injector. See {@link AUTO.$injector $injector}.
     *
     * <pre>
     *  angular.module('root').
     *    value('answer', 42);
     *
     *  var rootInjector = angular.inejector(['root']);
     *  expect(rootInjector.get('answer')).toEqual(42);
     *
     *  var childInjector = rootInjector.locals({
     *    answer: -42,
     *    greeting: 'hello'
     *  });
     *  expect(rootInjector.get('answer')).toEqual(42);
     *  expect(childInjector.get('answer')).toEqual(-42);
     *  expect(rootInjector.get('greeting')).toEqual('hello');
     * </pre>
     */
    locals: function(locals, resolveFn) {
      return new LocalsInjector(this, locals, resolveFn);
    },

    /**
     * @ngdoc method
     * @name AUTO.$injector#limit
     * @methodOf AUTO.$injector
     *
     * @description
     * Create a child injector which automatically prefixes all calls to {@link AUTO.$injector#get
     * get} with a prefix.
     *
     * @param {string} prefix .
     * @returns {LimitInjector} Injector an injector. See {@link AUTO.$injector $injector}.
     *
     * <pre>
     *  angular.module('root').
     *    value('answer', 42);
     *
     *  var rootInjector = angular.inejector(['root']);
     *  expect(rootInjector.get('answer')).toEqual(42);
     *
     *  var childInjector = rootInjector.locals({
     *    answer: -42,
     *    greeting: 'hello'
     *  });
     *  expect(rootInjector.get('answer')).toEqual(42);
     *  expect(childInjector.get('answer')).toEqual(-42);
     *  expect(rootInjector.get('greeting')).toEqual('hello');
     * </pre>
     */
    limit: function(prefix) {
      return new LimitInjector(this, prefix);
    }
  }));

  /**
   * @constructor
   * @extends Injector
   */
  function LocalsInjector(parent, locals, resolveFn) {
    assertArg(locals);
    this.$$parent = parent;
    this.$$locals = locals;
    this.$$resolve = resolveFn;

    locals['$injector'] = this;
  }

  goog.inherits(LocalsInjector, Injector);

  /** @override */
  LocalsInjector.prototype.get = function(name) {
    var locals = this.$$locals,
        resolve,
        service;

    if (locals.hasOwnProperty(name)) {
      return locals[name];
    } else if ((resolve = this.$$resolve) && ((service = resolve(name, this)) != undefined) ) {
      return service;
    } else {
      return this.$$parent.get(name);
    }
  };


  /**
   * @constructor
   * @extends Injector
   * @param {Object} parent
   * @param {string} prefix
   */
  function LimitInjector(parent, prefix) {
    this.$$parent = parent;
    this.$$prefix = prefix;
  }

  goog.inherits(LimitInjector, Injector);

  /** @override */
  LimitInjector.prototype.get = function(name) {
    return this.$$parent.get(this.$$prefix + name);
  };

  /** @override */
  LimitInjector.prototype.enumerate = function() {
    var list = [],
        prefix = this.$$prefix;

    forEach(this.$$parent.enumerate(), function(name) {
      if (name.indexOf(prefix) == 0) {
        list.push(name.substr(prefix.length));
      }
    });
    return list;
  };


  /**
   * @implements {angular.Injector}
   * @constructor
   */
  function TerminalInjector() {
    this.$$providers = {};
    this.$$instances = {};
    this.$$modules = new angular.HashMap();
  }

  TerminalInjector.prototype = {
    /** @override */
    load: Injector.prototype.load,
    /** @override */
    instantiate: angular.Injector.notImplemented,
    /** @override */
    invoke: angular.Injector.notImplemented,
    /** @override */
    locals: angular.Injector.notImplemented,
    /** @override */
    enumerate: function() {
      return [];
    },
    /** @override */
    get: function(name, contextFn) {
      pathPush(name, contextFn);
      try {
        angular.Injector.error(path, 'Unknown service');
      } finally {
        pathPop();
      }
    }
  };

  /**
   * @ngdoc overview
   * @name AUTO
   * @description
   *
   * Implicit module which gets automatically added to each {@link AUTO.$injector $injector}.
   */

  /**
   * @ngdoc object
   * @name AUTO.$provide
   *
   * @description
   *
   * Use `$provide` to register new providers with the `$injector`. The providers are the factories
   * for the service instance. The providers share the same name as the instance they create with
   * the `Provider` suffixed to them.
   *
   * A provider is an object with a `$get()` method. The injector calls the `$get` method to create
   * a new instance of a service. The provider can have additional methods which can allow for
   * configuration of the provider.
   *
   * <pre>
   *   function GreetProvider() {
   *     var salutation = 'Hello';
   *
   *     this.salutation = function(text) {
   *       salutation = text;
   *     };
   *
   *     this.$get = function() {
   *       return function (name) {
   *         return salutation + ' ' + name + '!';
   *       };
   *     };
   *   }
   *
   *   describe('Greeter', function() {
   *
   *     beforeEach(module(function($provide) {
   *       $provide.provider('greet', GreetProvider);
   *     });
   *
   *     it('should greet', inject(function(greet) {
   *       expect(greet('angular')).toEqual('Hello angular!');
   *     }));
   *
   *     it('should allow configuration of salutation', function() {
   *       module(function(greetProvider) {
   *         greetProvider.salutation('Ahoj');
   *       });
   *       inject(function(greet) {
   *         expect(greet('angular')).toEqual('Ahoj angular!');
   *       });
   *     )};
   *
   *   });
   * </pre>
   *
   * # Private services
   *
   * Creation of child injectors creates a tree structure of injectors. This means that a service is
   * tied to a specific injector and can never access services on child injector, since the child
   * injector can be garbage collected during application lifetime we have to ensure that there are
   * no references from the parent injector to the child injector.
   *
   * There are cases where it is desirable to access child services from parent injector. For
   * example a child injector can define more directives, but the compiler service on the parent
   * injector would not be able to see them. A private services addresses this issue.
   *
   * A private service is a service which is only visible on a given injector. Child injectors can
   * not see the instance, only the provider. The child injector uses the provider to create a new
   * instance of the service on its self. (Provider comes from parent, but a singleton instance is
   * saved to child injector.) This allows the provider to ask for services in the child injector,
   * but be properly garbage collected when a child injector goes away.
   *
   * <pre>
   *   angular.module('root',[]).
   *     factory('greeting', factory(salutation) {
   *       return salutation + 'world!';
   *     }, true);
   *     value('salutation', 'Hello');
   *
   *   var rootInjector = angular.injector(['root']);
   *   expect(rootInjector.get('greeting')).toEqual('Hello world!');
   *
   *   angular.module('child', []).
   *     value('salutation', 'Ahoj');
   *
   *   var childInjector = rootInjector(['child']);
   *   expect(rootInjector.get('greeting')).toEqual('Hello world!');
   *   expect(childInjector.get('greeting')).toEqual('Ahoj world!');
   * </pre>
   *
   * @constructor
   * @extends Injector
   */
  function ProviderInjector(instanceInjector) {
    var providerInjector = this,
        providers = instanceInjector.$$providers,
        instances = instanceInjector.$$instances,
        pInstances = {
          '$injector': [this],
          '$provide': [{
            provider: supportObject(provider),
            factory: supportObject(factory),
            service: supportObject(service),
            value: supportObject(value),
            constant: supportObject(constant),
            decorator: decorator
          }]
        },
        parent = new TerminalInjector();

    this.get = function(name) {
      var instance = pInstances[name] ||
                     instances[name] ||
                     providers[name];

      if (instance instanceof Array) return instance[0];

      return parent.get(name);
    }

    function supportObject(delegate) {
      return function(key, value, isPrivate) {
        if (isObject(key)) {
          forEach(key, reverseParams(delegate));
        } else {
          return delegate(key, value, isPrivate);
        }
      };
    }

    /**
     * @ngdoc method
     * @name AUTO.$provide#provider
     * @methodOf AUTO.$provide
     * @description
     *
     * Register a provider for a service. The providers can be retrieved in configuration and can
     * have additional configuration methods.
     *
     * @param {string|Object.<Function|null>} name The name of the instance.
     * NOTE: the provider will be available under `name + 'Provider'` key.
     * @param {(Object|Function)} provider_ If the provider is:
     *
     *   - `Object`: then it should have a `$get` method. The `$get` method will be invoked using
     *               {@link AUTO.$injector#invoke $injector.invoke()} when an instance needs to be
     *               created. Optionally it can also hove `$private` property set to true.
     *   - `Constructor`: a new instance of the provider will be created using
     *               {@link AUTO.$injector#instantiate $injector.instantiate()}, then treated as
     *               `object`.
     *
     * @returns {Object} registered provider instance
     *
     * <pre>
     *   function Greeting() {
     *     this.salutation = 'Hello';
     *
     *     this.$get = function(subject) {
     *       return this.salutation + ' ' + subject + '!';
     *     }
     *   }
     *
     *   angular.module('myModule').
     *     value('subject', 'World').
     *     provider('greeting', Greeting).
     *     config(function(greetingProvider) {
     *        expect(greetingProvider.salutation).toEqual('Hello');
     *
     *        greetingProvider.salutation = 'Ahoj';
     *     });
     *
     *   var injector = angular.injector(['myModule']);
     *   expect(injector.get('greeting')).toEqual('Ahoj World!');
     * </pre>
     */
    function provider(name, provider_) {
      var instance = provider_;
      if (isFunction(provider_)) {
        /** @constructor */
        var Provider = /** @type function(new:Provider) */ (provider_);
        instance = providerInjector.instantiate(Provider);
      }
      if (!instance) {
        throw Error('Provider ' + name + ' must be defined.');
      }
      if (!instance.$get) {
        throw Error('Provider ' + name + ' must define $get factory method.');
      }
      providers[name + PROVIDER_SUFFIX] = [instance];
      return instance;
    }

    /**
     * @ngdoc method
     * @name AUTO.$provide#factory
     * @methodOf AUTO.$provide
     * @description
     *
     * A short hand for configuring services if only `$get` method is required.
     *
     * @param {(string|Object.<string,Function>)} name The name of the instance or a hashmap of name
     *   to factory functions for bulk registration.
     * @param {function()|Array.<string,Function>} factoryFn The factoryFn for the instance creation. Internally this is a short hand for
     * `$provide.provider(name, {$get: $getFn})`.
     * @param {boolean=} [isPrivate=false] A private service is only visible to the current
     *   injector. A child injector can not see the instance, and instead will make its own
     *   instance.
     * @returns {Object} registered provider instance
     *
     * <pre>
     *   angular.module('myModule').
     *     value('salutation', 'Hello').
     *     value('subject', 'World').
     *     factory('greeting', function(salutation, subject) {
     *       return salutation + ' ' + subject + '!';
     *     });
     *
     *   var injector = angular.injector(['myModule']);
     *   expect(injector.get('greeting')).toEqual('Hello World!');
     * </pre>
     */
    function factory(name, factoryFn, isPrivate) {
      return provider(name, { $get: factoryFn, $private: isPrivate });
    }

    /**
     * @ngdoc method
     * @name AUTO.$provide#service
     * @methodOf AUTO.$provide
     * @description
     *
     * Register a class as a way of creating an instance. The class constructor will be invoked
     * using {@link AUTO.$injector#instantiate instantiate} method.
     *
     * @param {(string|Object.<string,Function>)} name The name of the instance or a hashmap of name
     *   to contstructor functions for bulk registration.
     * @param {Function} constructor A class (constructor function) that will be instantiated.
     * @param {boolean=} [isPrivate=false] A private service is only visible to the current
     *   injector. A child injector can not see the instance, and instead will make its own
     *   instance.
     *
     * @returns {Object} registered provider instance
     *
     * <pre>
     *   function Engine(type) {
     *    this.type = type;
     *   }
     *   function Car(engine) {
     *    this.engine = engine;
     *   }
     *
     *   angular.module('myModule').
     *     value('type', 'v8').
     *     service('car', Car).
     *     service('engine', Engine);
     *
     *   var injector = angular.injector(['myModule']);
     *   var car = injector.get('car');
     *
     *   expect(typeof car).toBe(Car);
     *   expect(typeof car.engine).toBe(Engine);
     *   expect(car.engine.type).toEqual('v8');
     * </pre>
     */
    function service(name, constructor, isPrivate) {
      return factory(name, ['$injector', function($injector) {
        return $injector.instantiate(constructor);
      }], isPrivate);
    }


    /**
     * @ngdoc method
     * @name AUTO.$provide#value
     * @methodOf AUTO.$provide
     * @description
     *
     * A simplest form of injection where the value is always constant.
     *
     * @param {(string|Object.<string,*>)} name The name of the instance or a hashmap of name
     *   to value for bulk registration.
     * @param {*} value The value.
     * @returns {Object} registered provider instance
     *
     * <pre>
     *   angular.module('myModule').
     *     value('answer', 42);
     *   var injector = angular.injector(['myModule']);
     *   expect(injector.get('answer')).toEqual(42);
     * </pre>
     */
    function value(name, value) { return factory(name, valueFn(value)); }


    /**
     * @ngdoc method
     * @name AUTO.$provide#constant
     * @methodOf AUTO.$provide
     * @description
     *
     * A constant value, but unlike {@link AUTO.$provide#value value} it can be injected
     * into configuration function (oy other modules) and providers. Constants are not
     * interceptable by {@link AUTO.$provide#decorator decorator}.
     *
     * @param {string} name The name of the constant.
     * @param {*} value The constant value.
     * @returns {Object} registered instance
     *
     * <pre>
     *   angular.module('myModule').
     *     constant('answer', 42).
     *     config(function($provide, answer) {
     *       // only constants can be injected into config functions.
     *       // Services instances (value, factory, provider) can not.
     *     });
     *   var injector = angular.injector(['myModule']);
     *   expect(injector.get('answer')).toEqual(42);
     * </pre>
     */
    function constant(name, value) {
      providers[name] = [value];
      instances[name] = [value];
      return null;
    }


    /**
     * @ngdoc method
     * @name AUTO.$provide#decorator
     * @methodOf AUTO.$provide
     * @description
     *
     * Decoration of service, allows the decorator to intercept the service instance creation. The
     * returned instance may be the original instance, or a new instance which delegates to the
     * original instance.
     *
     * @param {string} serviceName The name of the service to decorate.
     * @param {function()} decorFn This function will be invoked when the service needs to be
     *    instanciated. The function is called using the {@link AUTO.$injector#invoke
     *    injector.invoke} method and is therefore fully injectable. Local injection arguments:
     *
     *    * `$delegate` - The original service instance, which can be monkey patched, configured,
     *      decorated or delegated to.
     * @returns {*} nothing.
     *
     *
     * <pre>
     *   angular.module('myModule').
     *     config(function($provide) {
     *      $provide.decorate('$rootScope', function($delegate) {
     *        var $rootScope = $delegate;
     *
     *        $rootScope.mark = 'marked';
     *        return $rootScope;
     *      });
     *     });
     *
     *   var injector = angular.injector(['myModule']);
     *   var $rootScope = injector.get('$rootScope');
     *   expect($rootScope.mark).toEqual('marked');
     * </pre>
     */
    function decorator(serviceName, decorFn) {
      var origProvider = providerInjector.get(serviceName + PROVIDER_SUFFIX),
          orig$get = origProvider.$get;

      origProvider.$get = function() {
        var origInstance = instanceInjector.invoke(orig$get, origProvider);
        return instanceInjector.locals({$delegate: origInstance}).invoke(decorFn);
      };
    }
  }

  goog.inherits(ProviderInjector, Injector);

  return new TerminalInjector().load(modulesToLoad)
}

/**
 *
 * @param {Array.<string|angular.annotate.Info>} path
 * @param {string} reason
 */
angular.Injector.error = function(path, reason) {
  var index = path.length - 1;
  var error = [reason + ': ' + path[index - 1] ];

  while(index>0) {
    /** @type {angular.annotate.Info} */;
    var info = /** @type {angular.annotate.Info} */ (path[index--]);
    VAR(info).is(angular.annotate.Info, undefined);

    /** @type {string} */
    var name = /** @type {string} */ (path[index--]);
    VAR(name).is(String);

    error.push('   service: ' + name + ' requested by ' + angular.Injector.error.extractLocation(info));

  }
  throw new Error(error.join('\n'));
}

/**
 *
 * @param {angular.annotate.Info} fn
 */
angular.Injector.error.extractLocation = function(fn) {
  if (!fn) return '<imperitive>';
  /** @type {angular.annotate.Info} */
  var info = fn;
  var source = fn.toString();
  var match = source.match(FN_ARGS);
  var injectLocation = fn.$injectLocation ;
  var location = injectLocation ? injectLocation.stack.split('\n')[2] : '';

  return match[0] + ' { ... }' + location;
}

angular.Injector.error.extractLocation.REGEXP_ = /^([^\{]+\{).*(\}.*)$/;


//TODO(misko): clean up
angular.injector = createInjector;
