'use strict';

/**
 * @param {Arguments} args
 * @param {...TYPE.Assertion} opt_assertions
 */
var VERIFY = function(args, opt_assertions) {
  if (COMPILED) return;

  var offset = 1;
  var errors;

  for (var i = 0, ii = arguments.length - offset; i < ii; i++) {
    var argAssertion = arguments[i + offset];

    argAssertion.value = args[i];
    if (!argAssertion.assert()) {
      if (!errors) errors = [];

      errors.push('Argument ' + argAssertion.name + ' at position ' + (i + 1) + ' ' + argAssertion.error());
    }
  }

  if (errors) {
    throw new Error(errors.join('\n'));
  }
}

/**
 * @param {*} value
 * @param {string=} argName
 * @returns {TYPE.Assertion}
 */
var VAR = function(value, argName) {
  return new TYPE.Assertion(value, argName, true);
};

/**
 * @param {string=} argName
 * @returns {TYPE.Assertion}
 */
var ARG = function(argName) {
  return new TYPE.Assertion(undefined, argName);
};

/**
 * @template T
 * @param {string} name
 * @param {function(T):boolean} assertion
 * @return {function(this:T)}
 */
var TYPE = function(name, assertion) {
  if (window.COMPILED) return function() {};

  var Type = function __TYPEDEF__() {};

  Type.__NAME__ = name;
  Type.__ASSERT__ = assertion;
  Type.toString = function() { return name };
  return Type;
};

/**
 * @param {*} value
 * @param {number=} depth
 */
TYPE.extract = function(value, depth) {
  depth = depth || 0;
  if (depth > 3) {
    return TYPE.UNKNOWN;
  }

  if (value === null) {
    return 'null';
  }

  switch (typeof value) {
    case 'object':
        var Type = value.constructor;

        if (!Type) {
          return '[native object]';
        } else if (Type == Object) {
          var types = [];

          for (var k in value) {
            var type = TYPE.extract(value[k], depth + 1);

            if (value.hasOwnProperty(k) && !types[type]) {
              types[type] = true;
              types.push(k + ': ' + type);
            }
          }

          return '{' + types.join(', ') + '}';
        } else if (Type == Array) {
          var types = [];

          for (var i = 0, ii = value.length; i < ii; i++) {
            var type = TYPE.extract(value[i], depth + 1);

            if (!types[type]) {
              types[type] = true;
              types.push(type);
            }
          }

          types.sort();
          return 'Array.<' + types.join('|') + '>';
        } else {
          return Type.__Name__ || Type.name;
        }
    case 'function':
        var args = [];

        for (var i = 0, ii = value.length; i < ii; i++) {
          args.push(TYPE.UNKNOWN);
        }

        return 'function(' + args.join(', ') + ')';
    default:
      return typeof value;
  }
};

TYPE.UNKNOWN = TYPE('?', function() { return true; });
TYPE.ANY = TYPE('*', function() { return true; });
TYPE['undefined'] = TYPE('undefined', function(value) { return value === undefined; });
TYPE['null'] = TYPE('null', function(value) { return value === null; });
TYPE.String = TYPE('string', function(value) { return typeof value === 'string' || value instanceof String; });
TYPE.Boolean = TYPE('boolean', function(value) { return typeof value === 'boolean' || value instanceof Boolean; });
TYPE.Number = TYPE('number', function(value) { return typeof value === 'number' || value instanceof Number; });
TYPE.Function = TYPE('function', function(value) { return typeof value === 'function' || value instanceof Function; });

/**
 *
 * @param {*} Type
 * @return {Function}
 */
TYPE.resolve = function(Type) {
  if (Type === undefined) {
    Type = TYPE['undefined'];
  } else if (Type === null) {
    Type = TYPE['null'];
  } else if (Type === String) {
    Type = TYPE.String;
  } else if (Type === Boolean) {
    Type = TYPE.Boolean;
  } else if (Type === Number) {
    Type = TYPE.Number;
  } else if (Type === Function) {
    Type = TYPE.Function;
  }

  if (typeof Type !== 'function') {
    throw new Error('Type must be a constructor function, got: ' + typeof  Type);
  }
  return Type;
}

/**
 * @param {*} value
 * @param {Object} typeObject
 */
TYPE.verifyStruct = function(value, typeObject) {
  if (!value) return false;
  for(var key in typeObject) {
    if (typeObject.hasOwnProperty(key)) {
      var Type = TYPE.resolve(typeObject[key]);

      if (!TYPE.assert(Type, value[key])) {
        return false;
      }
    }
  }

  return true;
};

/**
 * @param {*=} value
 * @param {string=} name
 * @param {boolean=} immediate
 * @constructor
 */
TYPE.Assertion = function(value, name, immediate) {
  if (COMPILED) return;
  this.value = value;
  this.name = name;
  this.immediate = immediate;
};

/**
 *
 * @param {...*} var_union
 * @return {TYPE.Assertion}
 */
TYPE.Assertion.prototype.is = function(var_union) {
  if (arguments.length == 0) {
    throw new Error('At least one argument is required.');
  }
  this.Type = TYPE.union(arguments);

  if (this.immediate) {
    if (!this.assert()) {
      throw new Error((this.name ? "var '" + this.name + "' " : '') + this.error());
    }
  }
  return this;
};

/**
 * @return {string}
 */
TYPE.Assertion.prototype.error = function() {
  return 'expecting ' + TYPE.toString([this.Type]) + ' was ' + TYPE.extract(this.value);

};

/**
 * @return {boolean}
 */
TYPE.Assertion.prototype.assert = function() {
  if (!this.Type) {
    throw new Error('Missing .is() invocation.');
  }

  return TYPE.assert(this.Type, this.value);
};

/**
 *
 * @param {Array.<*>|Arguments} types
 * @param {string=} separator
 * @return {string}
 */
TYPE.toString = function(types, separator) {
  var parts = [];

  for (var i = 0, ii = types.length; i < ii; i++) {
    var type = TYPE.resolve(types[i]);
    var name = type.__NAME__ || type.name;

    parts.push(name);
  }

  return parts.join(separator || '|');
};

/**
 * @param {Array.<*>|Arguments} Types
 * @return {Function}
 */
TYPE.union = function(Types) {
  var length = Types.length;

  if (length == 0) {
    throw new Error('At least one type must be specified.');
  }

  for (var i = 0, ii = length; i < ii; i++) {
    Types[i] = TYPE.resolve(Types[i]);
  }

  if (length == 1) {
    return TYPE.resolve(Types[0]);
  } else {
    return TYPE(TYPE.toString(Types), function(value) {
      for (var i = 0, ii = length; i < ii; i++) {
        if (TYPE.assert(/** @type {Function} */ (Types[i]), value)) return true;
      }
      return false;
    });
  }
}

/**
 * @param {Function} Type
 * @param {*} value
 * @return {boolean}
 */
TYPE.assert = function(Type, value) {
  if (typeof Type !== 'function') {
    throw new Error('Type must be a constructor function, got: ' + typeof  Type);
  }

  return Type.__ASSERT__
      ? Type.__ASSERT__(value)
      : value instanceof Type;
}

/**
 * @param {...*} var_arg_types
 * @return {Function}
 */
var UNION = function(var_arg_types) {
  return TYPE.union(arguments);
};

/**
 * @param {...*} var_union
 * @return {Function}
 */
var ARRAY = function(var_union) {
  var Type = arguments.length ? TYPE.union(arguments) : TYPE.ANY;
  var name = 'Array.<' + TYPE.toString([Type]) + '>';

  return TYPE(name, function(array) {
    if (!(array instanceof Array)) return false;

    for (var i = 0, ii = array.length; i < ii; i++) {
      if (!TYPE.assert(Type, array[i])) return false;
    }

    return true;
  });
};

/**
 * @param {...*} var_union
 * @return {Function}
 */
var OBJECT = function(var_union) {
  var Type = arguments.length ? TYPE.union(arguments) : TYPE.ANY;
  var name = 'Object.<' + TYPE.toString([Type]) + '>';

  return TYPE(name, function(map) {
    if (typeof map !== 'object' || map instanceof Array) return false;

    for (var key in map) {
      if (map.hasOwnProperty(key) && !TYPE.assert(Type, map[key])) return false;
    }

    return true;
  });
};

/**
 * @param {...*} var_union
 * @return {Function}
 */
var FUNCTION = function(var_union) {
  var Type = arguments.length ? TYPE.union(arguments) : TYPE.ANY;
  var name = 'function(' + TYPE.toString(arguments, ', ') + ')';

  return TYPE(name, function(fn) {
    return typeof fn == 'function';
  });
}


Array.of = ARRAY;
Object.of = OBJECT;
Function.with = FUNCTION;
