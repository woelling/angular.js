'use strict';

goog.provide('angular.core.Block');
goog.provide('angular.core.BlockCache');
goog.provide('angular.core.DirectiveDef');
goog.provide('angular.core.NodeDirectiveDef');
goog.provide('angular.core.BlockInstance');

goog.require('angular.injector');
goog.require('angular.core.dom.select');
goog.require('angular.core.ExceptionHandler');



/**
 * @param {angular.core.DirectiveType} DirectiveType
 * @param {string=} value
 * @param {Object.<angular.core.BlockType>=} blockTypes
 * @constructor
 */
angular.core.DirectiveDef = function DirectiveDef(DirectiveType, value, blockTypes) {
  VERIFY(arguments,
    ARG('DirectiveType').is(Function),
    ARG('value').is(String, undefined),
    ARG('blockTypes').is(OBJECT(angular.core.BlockType), undefined));

  /** @type {angular.core.DirectiveType} */
  this.DirectiveType = DirectiveType;
  /** @type {string|undefined} */
  this.value = value;
  /** @type {Object.<angular.core.BlockType>} */
  this.blockTypes = /** @type {Object.<angular.core.BlockType>} */(blockTypes);
}

/**
 * @return {boolean}
 */
angular.core.DirectiveDef.prototype.isComponent = function() {
  return !!this.blockTypes;
}





/**
 * @param {string} selector
 * @param {Array.<angular.core.DirectiveDef>} directiveDefs
 * @constructor
 */
angular.core.NodeDirectiveDef = function NodeDirectiveDef(selector, directiveDefs) {
  VERIFY(arguments,
    ARG('selector').is(String),
    ARG('directiveDefs').is(ARRAY(angular.core.DirectiveDef)));

  /** @type {string} */
  this.selector = selector;
  /** @type {Array.<angular.core.DirectiveDef>} */
  this.directiveDefs = directiveDefs
}
/** @type {RegExp} @private */
angular.core.NodeDirectiveDef.STRIP_SPAN_ = /\+\d+$/;

angular.core.NodeDirectiveDef.prototype.stripSpan = function() {
  this.selector = this.selector.replace(angular.core.NodeDirectiveDef.STRIP_SPAN_, '');
};





/**
 * @param {Array.<angular.core.Block>=} blockInstances
 * @constructor
 */
angular.core.BlockCache = function BlockCache(blockInstances) {
  VERIFY(arguments,
    ARG('blockInstances').is(ARRAY(angular.core.Block), undefined));

  /** @type {Object.<Array.<angular.core.Block>>} */
  this.groupCache = {};

  if (!blockInstances) return;

  var groupCache = this.groupCache;

  for (var i = 0, ii = blockInstances.length; i < ii; i++) {
    /** @type {angular.core.Block} */
    var block = blockInstances[i];
    /** @type {string} */
    var group = block.group;

    if (groupCache.hasOwnProperty(group)) {
      groupCache[group].push(block);
    } else {
      groupCache[group] = [block];
    }
  }
};

/**
 * @param {function(angular.core.Block)=} callback
 */
angular.core.BlockCache.prototype.flush = function(callback) {
  forEach(this.groupCache,
      /**
       * @param {Array.<angular.core.Block>} blocks
       */
      function(blocks) {
        while(blocks.length) {
          /** @type {angular.core.Block} */
          var block = blocks.pop();

          callback && callback(block);
        }
      }
  );
};

/**
 *
 * @param {string} type
 * @return {angular.core.Block}
 */
angular.core.BlockCache.prototype.get = function(type) {
  if (this.groupCache.hasOwnProperty(type)) {
    /** @type {Array.<angular.core.Block>} */
    var blocks = this.groupCache[type];

    if (blocks.length) return blocks.shift();
  }
};





/**
 * @typedef {function(
 *      angular.core.NodeList,
 *      Array.<angular.core.NodeDirectiveDef>,
 *      (Array.<angular.core.BlockCache>|undefined),
 *      (string|undefined)
 *   ):angular.core.Block}
 */
angular.core.BlockFactory = TYPE('angular.core.BlockFactory', function(value) {
  return typeof value == 'function';
});




/**
 * @param {angular.core.ExceptionHandler} $exceptionHandler
 * @param {angular.core.BlockListFactory} $blockListFactory
 * @param {angular.Injector} $injector
 * @param {angular.Injector} $emptyInjector
 * @param {angular.core.NodeList} blockElement
 * @param {Array.<angular.core.NodeDirectiveDef>} nodeDirectiveDefs
 * @param {Array.<angular.core.BlockCache>=} blockCaches
 * @param {string=} group
 * @constructor
 * @implements {angular.core.ElementWrapper}
 */
angular.core.Block = function Block($exceptionHandler, $blockListFactory, $injector, $emptyInjector,
                                    blockElement, nodeDirectiveDefs, blockCaches, group) {
  VERIFY(arguments,
    ARG('$exceptionHandler').is(angular.core.ExceptionHandler),
    ARG('$blockListFactory').is(angular.core.BlockListFactory),
    ARG('$injector').is(angular.Injector),
    ARG('$emptyInjector').is(angular.Injector),
    ARG('blockElement').is(angular.core.NodeList),
    ARG('nodeDirectiveDefs').is(ARRAY(angular.core.NodeDirectiveDef)),
    ARG('blockCaches').is(ARRAY(angular.core.BlockCache), undefined),
    ARG('group').is(String, undefined));

  /** @type {string} */
  this.group = group || '';
  /** @type {angular.core.ExceptionHandler} */
  this.$exceptionHandler = $exceptionHandler;
  /** @type {angular.core.NodeList} */
  this.elements = blockElement;
  /** @type {angular.core.ElementWrapper} */
  this.previous = this.next = null;

  VAR(blockElement).is(angular.core.NodeList);

  /** @type {Array.<angular.core.Directive>} */
  var blockDirectives = this.directives = [];
  /** @type {angular.core.Block} */
  var block = this;

  // For each directive defined on the block
  for(var i = 0, ii = nodeDirectiveDefs.length; i < ii; i++) {
    /** @type {angular.core.NodeDirectiveDef} */
    var nodeDirectiveDef = nodeDirectiveDefs[i];
    /** @type {Node} */
    var node = angular.core.dom.select(blockElement, nodeDirectiveDef.selector)[0];
    /** @type {angular.core.BlockType} */
    var BlockType;
    /** @type {Object.<angular.core.DirectiveType>} */
    var directiveTypeMap = {};
    /** @type {Array.<string>} */
    var directiveList = [];
    /** @type {Object.<string|undefined>} */
    var directiveValues = {};
    /** @type {Object.<*>} */
    var locals = {
      '$block': block,
      '$element': node,
      '$value': undefined
    };
    /** @type {angular.LocalFactoryFn} */
    var localFactoryFn = function(name, elementInjector) {
      VERIFY(arguments,
        ARG('name').is(String),
        ARG('elementInjector').is(angular.Injector));

      /** @type {Array.<string>} */
      var match = name.match(angular.core.Block.DYNAMIC_SERVICES_REGEX_);
      /** @type {angular.core.DynamicServiceFactoryFn|null} */
      var dynamicServiceFactoryFn = match && angular.core.Block.DYNAMIC_SERVICES_[match[1]];
      /** @type {*} */
      var previousValue;

      if (dynamicServiceFactoryFn) {
        return locals[name] = dynamicServiceFactoryFn(match[2], block, node, $injector);
      } else if (directiveTypeMap.hasOwnProperty(name)) {
        previousValue = locals['$value'];
        try {
          locals['$value'] = directiveValues[name];
          return locals[name] = elementInjector.instantiate(/** @type {Function} */(directiveTypeMap[name]));
        } catch (e) {
          $exceptionHandler(e);
        } finally {
          locals['$value'] = previousValue;
        }
      }
    };
    /** @type {angular.Injector} */
    var elementInjector = $emptyInjector.locals(locals, localFactoryFn);

    // For each directive defined on the element of the block
    for(var directiveDefs = nodeDirectiveDef.directiveDefs,
            j = 0, jj = directiveDefs.length; j < jj; j++) {
      try {
        /** @type {angular.core.DirectiveDef} */
        var directiveDef = directiveDefs[j];
        /** @type {angular.core.DirectiveType} */
        var DirectiveType = directiveDef.DirectiveType;
        /** @type {string} */
        var directiveName = DirectiveType.$name || DirectiveType.name || nextUid();

        if (directiveDef.isComponent()) {
          /** @type {angular.core.BlockCache} */
          var blockCache = blockCaches && blockCaches.shift() || new angular.core.BlockCache();

          /** @type {angular.core.BlockList} */
          var anchor = $blockListFactory([node], directiveDef.blockTypes, blockCache);

          locals['$anchor'] = anchor;
        }

        directiveTypeMap[directiveName] = DirectiveType;
        directiveList.push(directiveName);
        directiveValues[directiveName] = directiveDef.value;
      } catch(e) {
        this.$exceptionHandler(e);
      }
    }

    for(var k = 0, kk = directiveList.length; k < kk; k++) {
      blockDirectives.push(elementInjector.get(directiveList[k]));
    }
  }
};

angular.annotate.$inject(
    ['$exceptionHandler', '$blockListFactory', '$injector', '$emptyInjector'],
    angular.core.Block,
    true);

/**
 * @param {Element} element
 * @param {string} name
 * @return {function(string=):string}
 */
angular.core.Block.attrAccessorFactory = function(element, name) {
  VERIFY(arguments,
    ARG('element').is(Element),
    ARG('name').is(String));

  /**
   * @param {string=} value
   * @return string
   */
  return function(value) {
    return arguments.length
        ? element.setAttribute(name, /** @type {string} */ (value)) || value
        : element.getAttribute(name);
  };
};

/**
 * @param {Element} element
 * @param {string} name
 * @return {function(boolean=):boolean}
 */
angular.core.Block.classAccessorFactory = function(element, name) {
  /**
   * @param {boolean=} value
   * @return {boolean}
   */
  return function(value) {
    var className = element.className,
        paddedClassName = ' ' + className + ' ',
        hasClass = paddedClassName.indexOf(' ' + name + ' ') != -1;

    if (arguments.length) {
      if (!value && hasClass) {
        paddedClassName = paddedClassName.replace(' ' + name + ' ', ' ');
        element.className =
            paddedClassName.substring(1, paddedClassName.length - 2);
      } else if (value && !hasClass) {
        element.className = className + ' ' + name;
      }
      hasClass = !!value;
    }
    return hasClass;
  };
};

/**
 * @param {string} name
 * @param {Node} element
 * @return {function(string=):string}
 */
angular.core.Block.styleAccessorFactory = function(element, name) {
  /**
   * @param {string=} value
   * @return {string}
   */
  return function(value) {
    if (arguments.length) {
      if (!value) {
        value = '';
      }
      element.style[name] = value;
    } else {
      value = element.style[name];
    }
    return value;
  };
};





/** @typedef {function(string, angular.core.Block, Node, angular.Injector):*} */
angular.core.DynamicServiceFactoryFn;

/**
 * @type {RegExp}
 * @private
 */
angular.core.Block.DYNAMIC_SERVICES_REGEX_ =
    /^(\$text|\$attr_?|\$style_?|\$class_?|\$on_?|\$prop_?|\$service_)(.*)$/;

/**
 * @type {Object.<angular.core.DynamicServiceFactoryFn>}
 * @private
 */
angular.core.Block.DYNAMIC_SERVICES_ = {
  '$text': function(name, block, element) {
    return element.nodeType == 3 /* text node */
        ? function(value) { element.nodeValue = value || ''; }
        : function(value) { element.innerText = value || ''; };
  },

  '$attr_': function(name, block, element) {
    return angular.core.Block.attrAccessorFactory(name, element);
  },

  '$attr': function(name, block, element) {
    VAR(element).is(Element);
    return bind(null, angular.core.Block.attrAccessorFactory, element);
  },

  '$style_': function(name, block, element) {
    return angular.core.Block.styleAccessorFactory(name, element);
  },

  '$style': function(name, block, element) {
    return bind(null, angular.core.Block.styleAccessorFactory, element);
  },

  '$class_': function(name, block, element) {
    return angular.core.Block.classAccessorFactory(name, element);
  },

  '$class': function(name, block, element) {
    return bind(null, angular.core.Block.classAccessorFactory, element);
  },

  '$on_': function(name, block, element) {
    // TODO: there needs to be a way to clean this up on block detach
    return function(callback) {
      if (name == 'remove') {
        block.onRemove = callback;
      } else if (name == 'insert') {
        block.onInsert = callback;
      } else {
        element.addEventListener(name, callback);
      }
    }
  },

  '$prop_': function(name, block, element) {
    return function(value) {
      return element[name];
    }
  },

  '$service_': function(name, block, element, $injector) {
    return $injector.get(name);
  }
};

/**
 * @param {angular.core.Scope} scope
 */
angular.core.Block.prototype.attach = function(scope) {
  // Attach directives
  for(var directives = this.directives, i = 0, ii = directives.length; i < ii; i++) {
    try {
      if (directives[i].attach) directives[i].attach(scope);
    } catch(e) {
      this.$exceptionHandler(e);
    }
  }
};


/**
 * @param {angular.core.Scope} scope
 */
angular.core.Block.prototype.detach = function(scope) {
  for(var directives = this.directives, i = 0, ii = directives.length, directive; i < ii; i++) {
    try {
      directive = directives[i];
      directive.detach && directive.detach(scope);
    } catch(e) {
      this.$exceptionHandler(e);
    }
  }
};


/**
 * @param {angular.core.ElementWrapper} previousBlock
 * @return {angular.core.Block}
 */
angular.core.Block.prototype.insertAfter = function(previousBlock) {
  // Update Link List.
  if (this.next = previousBlock.next) {
    this.next.previous = this;
  }
  this.previous = previousBlock;
  previousBlock.next = this;

  // Update DOM
  /** @type {angular.core.NodeList} */
  var previousElements = previousBlock.elements;
  /** @type {Node} */
  var previousElement = previousElements[previousElements.length - 1];
  /** @type {Node} */
  var insertBeforeElement = previousElement.nextSibling;
  /** @type {Node} */
  var parentElement = previousElement.parentNode;
  /** @type {angular.core.NodeList} */
  var elements = this.elements;
  /** @type {boolean} */
  var preventDefault = false;

  function insertDomElements() {
    for(var i = 0, ii = elements.length; i < ii; i++) {
      parentElement.insertBefore(elements[i], insertBeforeElement);
    }
  }

  if (this.onInsert) {
    this.onInsert({
      preventDefault: function() {
        preventDefault = true;
        return insertDomElements;
      },
      element: elements[0]
    });
  }

  if (!preventDefault) {
    insertDomElements();
  }
  return this;
};

/**
 * @return {angular.core.Block}
 */
angular.core.Block.prototype.remove = function() {
  /** @type {boolean} */
  var preventDefault = false;
  /** @type {angular.core.NodeList} */
  var elements = this.elements;
  /** @type {Node} */
  var parent = elements[0].parentNode;

  function removeDomElements() {
    for(var j = 0, jj = elements.length; j < jj; j++) {
      parent.removeChild(elements[j]);
    }
  }

  if (this.onRemove) {
    this.onRemove({
      preventDefault: function() {
        preventDefault = true;
        return removeDomElements;
      },
      element: elements[0]
    });
  }

  if (!preventDefault) {
    removeDomElements();
  }

  // Remove block from list
  if (this.previous && (this.previous.next = this.next)) {
    this.next.previous = this.previous;
  }
  this.next = this.previous = null;
  return this;
};


/**
 * @param {angular.core.Block} previousBlock
 * @return {angular.core.Block}
 */
angular.core.Block.prototype.moveAfter = function(previousBlock) {
  var previousElements = previousBlock.elements,
      previousElement = previousElements[previousElements.length - 1],
      insertBeforeElement = previousElement.nextSibling,
      parentElement = previousElement.parentNode,
      blockElements = this.elements;

  for(var i = 0, ii = blockElements.length; i < ii; i++) {
    parentElement.insertBefore(blockElements[i], insertBeforeElement);
  }

  // Remove block from list
  if (this.previous.next = this.next) {
    this.next.previous = this.previous;
  }
  // Add block to list
  if (this.next = previousBlock.next) {
    this.next.previous = this;
  }
  this.previous = previousBlock;
  previousBlock.next = this;
  return this;
};


