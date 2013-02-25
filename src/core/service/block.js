'use strict';

goog.provide('angular.core.Block');
goog.provide('angular.core.BlockCache');
goog.provide('angular.core.DirectiveDef');
goog.provide('angular.core.NodeDirectiveDef');
goog.provide('angular.core.BlockInstance');

goog.require('angular.injector');
goog.require('angular.core.dom.select');
goog.require('angular.core.ExceptionHandler');
goog.require('angular.core.DirectivePositions');



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
    ARG('blockTypes').is(Object.of(angular.core.BlockType), undefined));

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
    ARG('blockInstances').is(Array.of(angular.core.Block), undefined));

  /** @type {Object.<Array.<angular.core.Block>>} */
  this.groupCache = {};
  this.preRenderedElementCount = 0;

  if (!blockInstances) return;

  var groupCache = this.groupCache;

  for (var i = 0, ii = blockInstances.length; i < ii; i++) {
    /** @type {angular.core.Block} */
    var block = blockInstances[i];
    /** @type {string} */
    var group = block.group;

    this.preRenderedElementCount += block.elements.length;
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
 * @param {angular.core.NodeList} blockNodeList
 * @param {angular.core.DirectivePositions} directivePositions
 * @param {Array.<angular.core.BlockCache>=} blockCaches
 * @param {string=} group
 * @constructor
 * @implements {angular.core.ElementWrapper}
 */
angular.core.Block = function Block($exceptionHandler, $blockListFactory, $injector, $emptyInjector,
                                    blockNodeList, directivePositions, blockCaches, group) {
  VERIFY(arguments,
    ARG('$exceptionHandler').is(angular.core.ExceptionHandler),
    ARG('$blockListFactory').is(angular.core.BlockListFactory),
    ARG('$injector').is(angular.Injector),
    ARG('$emptyInjector').is(angular.Injector),
    ARG('blockElement').is(angular.core.NodeList),
    ARG('directivePositions').is(angular.core.DirectivePositions),
    ARG('blockCaches').is(Array.of(angular.core.BlockCache), undefined),
    ARG('group').is(String, undefined));

  /** @type {angular.core.ExceptionHandler} */
  this.$exceptionHandler = $exceptionHandler;
  /** @type {angular.core.BlockListFactory} */
  this.$blockListFactory = $blockListFactory;
  /** @type {angular.Injector} */
  this.$injector = $injector;
  /** @type {angular.Injector} */
  this.$emptyInjector = $emptyInjector;
  /** @type {angular.core.NodeList} */
  this.elements = blockNodeList;
  /** @type {angular.core.ElementWrapper} */
  this.previous = this.next = null;
  /** @type {string} */
  this.group = group || '';
  /** @type {Array.<angular.core.Directive>} */
  this.directives = [];

  this.link_(blockNodeList, directivePositions, blockCaches);
};
angular.annotate.$inject(
    ['$exceptionHandler', '$blockListFactory', '$injector', '$emptyInjector'],
    angular.core.Block,
    true);

angular.core.Block.prototype.link_ = function(nodeList, directivePositions, blockCaches) {
  VERIFY(arguments,
    ARG('nodeList').is(angular.core.NodeList),
    ARG('directivePositions').is(angular.core.DirectivePositions),
    ARG('blockCaches').is(ARRAY(angular.core.BlockCache), undefined));

  var preRenderedIndexOffset = 0;
  var directiveDefsByName = {};

  for (var i = 0, ii = directivePositions.length; i < ii;) {
    var index = directivePositions[i++];
    var directiveDefs = directivePositions[i++];
    var childDirectivePositions = directivePositions[i++];
    var node = nodeList[index + preRenderedIndexOffset];
    var anchorsByName = {};
    var directiveNames = [];

    LOG('link', index, node, directiveDefs, childDirectivePositions)

    VAR(node).is(Node);

    if (directiveDefs) {
      for (var j = 0, jj = directiveDefs.length; j < jj; j++) {
        var blockCache;

        if (blockCaches && blockCaches.length) {
          blockCache = blockCaches.shift();
          preRenderedIndexOffset += blockCache.preRenderedElementCount;
        }

        var directiveDef = directiveDefs[j];
        var name = directiveDef.DirectiveType.$name;

        if (!name) {
          name = nextUid();
        }

        directiveNames.push(name);
        directiveDefsByName[name] = directiveDef;
        if (directiveDef.isComponent()) {
          anchorsByName[name] = this.$blockListFactory([node], directiveDef.blockTypes, blockCache);
        }
      }
      this.instantiateDirectives_(directiveDefsByName, directiveNames, node, anchorsByName);
    }
    if (childDirectivePositions) {
      this.link_(node.childNodes, childDirectivePositions, blockCaches);
    }
  }
};

angular.core.Block.prototype.instantiateDirectives_ = function(directiveDefsByName, directiveNames, node,
                                                               anchorsByName) {
  VERIFY(arguments,
    ARG('directiveDefsByName').is(Object.of(angular.core.DirectiveDef)),
    ARG('directiveNames').is(Array.of(String)),
    ARG('node').is(Node),
    ARG('anchorsByName').is(Object.of(angular.core.BlockList)));

  /** @type {angular.core.Block} */
  var block = this;

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

    if (dynamicServiceFactoryFn) {
      return locals[name] = dynamicServiceFactoryFn(match[2], block, node, block.$injector);
    } else if (locals.hasOwnProperty(name)) {
      return locals[name];
    } else if (directiveDefsByName.hasOwnProperty(name)) {
      try {
        var directiveDef = directiveDefsByName[name];

        locals['$anchor'] = anchorsByName.hasOwnProperty(name) ? anchorsByName[name] : undefined;
        locals['$value'] = directiveDef.value;
        return locals[name] = elementInjector.instantiate(/** @type {Function} */(directiveDef.DirectiveType));
      } catch (e) {
        block.$exceptionHandler(e);
      } finally {
        locals['$value'] = undefined;
        locals['$anchor'] = undefined;
      }
    }
  };

  var injector = this.$emptyInjector.locals(locals, localFactoryFn);

  for (var i = 0, ii = directiveNames.length; i < ii; i++) {
    this.directives.push(injector.get(directiveNames[i]));
  }
};

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
  // TODO(misko): this will try to insert regardless if the node is an existing server side pre-rendered instance.
  // This is inefficient since the node should already be at the right location. We should have a check
  // for that. If pre-rendered then do nothing. This will also short circuit animation.

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


