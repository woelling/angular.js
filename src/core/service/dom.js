'use strict';

goog.provide('angular.core.dom.clone');
goog.provide('angular.core.dom.extractTemplate');
goog.provide('angular.core.dom.htmlToDOM');
goog.provide('angular.core.dom.select');

angular.core.dom.ELEMENT_NODE = 1;
ASSERT_EQ(angular.core.dom.ELEMENT_NODE, Node.ELEMENT_NODE);

/**
 *
 * @param {angular.core.NodeList} nodeList
 * @constructor
 */
angular.core.dom.NodeCursor = function angular_core_dom_NodeCursor(nodeList) {
  VAR(nodeList).is(angular.core.NodeList);

  this.stack = [];
  this.elements = nodeList;
  this.index = 0;
};

extend(angular.core.dom.NodeCursor.prototype, /** @lends {angular.core.dom.NodeCursor.prototype} */ {
  cursorSize: function() {
    var node = this.elements[this.index];

    return (node.getAttribute && typeof node.getAttribute('include-next') == 'string') ? 2 : 1;
  },

  macroNext: function() {
    ASSERT(this.isValid());

    for(var i = 0, ii = this.cursorSize(); i < ii; i++, this.index++){}

    return this.isValid();
  },

  microNext: function() {
    var length = this.elements.length;
    var index = this.index;

    if (index < length) {
      index = (++this.index);
    }

    return index < length;
  },

  isValid: function() {
    return this.index < this.elements.length;
  },

  nodeList: function() {
    ASSERT(this.isValid());

    var node = this.elements[this.index];
    var nodes = [];

    for(var i = 0, ii = this.cursorSize(); i < ii; i++) {
      nodes.push(this.elements[this.index + i]);
    }

    return nodes;
  },

  descend: function() {
    ASSERT(this.isValid());

    var childNodes = this.elements[this.index].childNodes;
    var hasChildren = !!(childNodes && childNodes.length);

    if (hasChildren) {
      this.stack.push(this.index, this.elements);
      this.elements = angular.core.dom.NodeCursor.slice.call(childNodes);
      this.index = 0;
    }

    return hasChildren;
  },

  ascend: function() {
    ASSERT(this.stack.length > 1);

    this.elements = this.stack.pop();
    this.index = this.stack.pop();
    ASSERT(this.elements);
  },

  insertAnchorBefore: function(name) {
    ASSERT(this.isValid());

    var current = this.elements[this.index];
    var parent = current.parentNode;
    var anchor = document.createComment('ANCHOR: ' + name);

    angular.core.dom.NodeCursor.splice.call(this.elements, this.index, 0, anchor);
    this.index++;

    if (parent) {
      parent.insertBefore(anchor, current);
    }
  },

  replaceWithAnchor: function(name) {
    this.insertAnchorBefore(name);
    var childCursor = this.remove();

    this.index--;
    return childCursor
  },

  remove: function() {
    ASSERT(this.isValid());

    var nodes = this.nodeList();
    var parent = nodes[0].parentNode;

    angular.core.dom.NodeCursor.splice.call(this.elements, this.index, nodes.length);
    if (parent) {
      for (var i = 0, ii = nodes.length; i < ii; i++) {
        parent.removeChild(nodes[i]);
      }
    }
    return new angular.core.dom.NodeCursor(nodes);
  },

  isInstance: function() {
    ASSERT(this.isValid());

    var node = this.elements[this.index];

    return node && node.getAttribute && node.getAttribute('instance') ? true : false;
  }
});

angular.core.dom.NodeCursor.splice = Array.prototype.splice;
angular.core.dom.NodeCursor.slice = Array.prototype.slice;
angular.core.dom.NodeCursor.STRINGIFY = function(cursor) {
  var parts = [];
  var nodes = cursor.elements;
  var span = cursor.isValid() ? cursor.nodeList().length - 1 : 0;

  for (var i = 0, ii = nodes.length; i < ii; i++) {
    if (i == cursor.index) {
      parts.push('[[');
    }
    parts.push(STRINGIFY(nodes[i]));
    if (i == cursor.index + span) {
      parts.push(']]');
    }
  }
  if (!cursor.isValid()) {
    parts.push('[[EOF]]');
  }

  return parts.join('');
};


/**
 *
 * @param {angular.core.NodeList} elements
 * @return {angular.core.NodeList}
 */
angular.core.dom.clone = function (elements) {
  VERIFY(arguments,
    ARG('elements').is(angular.core.NodeList));
  /** @type {angular.core.NodeList} */
  var cloneElements = [];
  var i = 0, ii = elements.length;


  for(; i < ii; i++) {
    cloneElements[i] = elements[i].cloneNode(true);
  }
  return cloneElements;
}

angular.core.dom.insertAnchorBefore = function (element, anchorName) {
  VAR(element).is(Element);
  VAR(anchorName).is(String);

  element.parentNode.insertBefore(document.createComment(anchorName), element);
};

angular.core.dom.toNodeList = function (element) {
  VAR(element).is(Element);

  var nodeList = [element];

  while (isString(element.getAttribute('include-next')) && (element = element.nextSibling)) {
    nodeList.push(element)
  }
  return nodeList;
};

angular.core.dom.nextSiblingNode = function (nodes) {
  VAR(nodes).is(angular.core.NodeList);

  var element = nodes[nodes.length-1].nextSibling;

  while(element && element.nodeType != angular.core.dom.ELEMENT_NODE) {
    element = element.nextSibling;
  }

  return element;
};

angular.core.dom.remove = function (nodes) {
  VAR(nodes).is(angular.core.NodeList);

  var parent = nodes[0].parentNode;
  ASSERT(parent, STRINGIFY(nodes));

  for (var i = 0, ii = nodes.length; i < ii; i++) {
    parent.removeChild(nodes[i]);
  }
};


/**
 * @param {angular.core.Html} html
 * @return {angular.core.NodeList}
 */
angular.core.dom.htmlToDOM = function(html) {
  /** @type {Array.<string>} */
  var nodeMatch = html.match(angular.core.dom.htmlToDOM.NODE_NAME_REGEXP_);
  /** @type {?string} */
  var nodeName = nodeMatch && nodeMatch[1];
  /** @type {Array} */
  var wrap = angular.core.dom.htmlToDOM.PARENT_NODE_[lowercase(nodeName)] ||
          angular.core.dom.htmlToDOM.NO_WRAPS_;
  /** @type {number} */
  var depth = wrap[0];
  /** @type {string} */
  var pre = wrap[1];
  /** @type {string} */
  var post = wrap[2];
  /** @type {Node} */
  var div = document.createElement('div');
  /** @type {angular.core.NodeList} */
  var nodes = [];
  /** @type {angular.core.NodeList} */
  var childNodes;

  // Read about the NoScope elements here:
  // http://msdn.microsoft.com/en-us/library/ms533897(VS.85).aspx
  div.innerHTML = angular.core.dom.htmlToDOM.IE_NO_SCOPE_WORKAROUND_ + pre  + html + post;
  div.removeChild(div.firstChild); // remove the superfluous div

  childNodes = div.childNodes;
  while (depth--) {
    childNodes = childNodes[0].childNodes;
  }

  for(var i = 0, ii = childNodes.length; i < ii; i++ ) {
    nodes.push(childNodes[i]);
  }

  return nodes;
}
// Read about the NoScope elements here:
// http://msdn.microsoft.com/en-us/library/ms533897(VS.85).aspx
/** @type {string} @private */
angular.core.dom.htmlToDOM.IE_NO_SCOPE_WORKAROUND_ = '<div>&#160;</div>';
/** @type {RegExp} @private */
angular.core.dom.htmlToDOM.NODE_NAME_REGEXP_ = /\<([\w\d\-\_\:]+)/;
/** @type {Array} @private */
angular.core.dom.htmlToDOM.NO_WRAPS_    = [ 0, "",                   "" ];
/** @type {Array} @private */
angular.core.dom.htmlToDOM.TABLE_WRAP_  = [ 1, "<table>",            "</table>" ];
/** @type {Array} @private */
angular.core.dom.htmlToDOM.TBODY_WRAP_  = [ 2, "<table><tbody>",     "</tbody></table>" ];
/** @type {Array} @private */
angular.core.dom.htmlToDOM.TR_WRAP_     = [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ];
/** @type {Object.<Array>} @private */
angular.core.dom.htmlToDOM.PARENT_NODE_ = {
  'option':      [ 1, "<select multiple='multiple'>", "</select>" ],
  'legend':      [ 1, "<fieldset>",                   "</fieldset>" ],
  'thead':       angular.core.dom.htmlToDOM.TABLE_WRAP_,
  'tbody':       angular.core.dom.htmlToDOM.TABLE_WRAP_,
  'tfoot':       angular.core.dom.htmlToDOM.TABLE_WRAP_,
  'colgroup':    angular.core.dom.htmlToDOM.TABLE_WRAP_,
  'tr':          angular.core.dom.htmlToDOM.TBODY_WRAP_,
  'th':          angular.core.dom.htmlToDOM.TR_WRAP_,
  'td':          angular.core.dom.htmlToDOM.TR_WRAP_,
  'col':         [ 2, "<table><colgroup>",            "</colgroup></table>" ],
  'area':        [ 1, "<map>", "</map>" ]
};

/**
 * @param {angular.core.NodeList} roots
 * @param {angular.core.Selector} selector
 * @return {angular.core.NodeList}
 */
angular.core.dom.select = function (roots, selector) {
  VERIFY(arguments,
    ARG('roots').is(angular.core.NodeList),
    ARG('selector').is(angular.core.Selector));

  /** @type {Array.<string>|null} */
  var match = angular.core.dom.select.SELECTOR_REGEX_.exec(selector);

  if (!match) {
    if (selector.charAt(0) == '<') {
      return angular.core.dom.htmlToDOM(selector);
    } else {
      throw new Error('Unsupported selector: ' + selector);
    }
  }

  /** @type {Element} */
  var foundElement;
  /** @type {number|boolean} */
  var offset = match[3] ? match[4] * 1 : false;
  /** @type {number} */
  var span = match[6] * 1 || 0;
  /** @type {angular.core.NodeList} */
  var elements = [];

  if (!match[1] && !match[2] && match[4]) {
    // Select by offset
    var end = offset + span + 1;
    if (end > roots.length) {
      throw new Error('Selector offset too big.');
    }
    return roots.slice(offset, end);
  }

  for(var i = 0, ii = roots.length; !foundElement && i < ii; i++) {
    var rootElement = roots[i],
        isElement = rootElement.nodeType == 1;

    if (match[1] === '.') {
      // select the current element
      foundElement = roots[0];
    } else if (isElement && rootElement.className.indexOf(match[2]) != -1)  {
      // select element if class matches
      foundElement = rootElement;
    } else if (isElement) {
      // select elements using querySelector
      foundElement = rootElement.querySelector(match[1]);
    }
  }

  if (!foundElement) angular.core.dom.select.assert(selector, roots);

  if (offset !== false) {
    foundElement = foundElement.firstChild;
    if (!foundElement) angular.core.dom.select.assert(selector, roots);
    while(offset--) {
      if (!foundElement) angular.core.dom.select.assert(selector, roots);

      foundElement = foundElement.nextSibling;
    }
  }

  do {
    if (!foundElement) angular.core.dom.select.assert(selector, roots);
    elements.push(foundElement);
    if (!(span--)) {
      return elements;
    }
    foundElement = foundElement.nextSibling;
  } while(true);
}

/**
 * Supported formats
 * .
 * .name
 * .name+2
 * .>1
 * .>1+2
 * 1
 * 1+2
 */
/** @type {RegExp} @private */
angular.core.dom.select.SELECTOR_REGEX_ = /^(\.([^+>]*))?(\>?(\d+))?(\+(\d+))?$/;

/**
 * @param {string} selector
 * @param {angular.core.NodeList} roots
 */
angular.core.dom.select.assert = function(selector, roots) {
  VERIFY(arguments,
    ARG('selector').is(angular.core.Selector),
    ARG('roots').is(angular.core.NodeList));
  ASSERT(roots.length > 0);

  throw new Error('Can not select: ' + selector + ' ' + angular.core.dom.startingTag(roots[0]));
}

/**
 * @param {Node} element
 * @returns {string} Returns the string representation of the element.
 */
angular.core.dom.startingTag = function (element) {
  VERIFY(arguments,
    ARG('element').is(Node));

  var html = element.outerHTML;

  return html && html.
      match(/^(<[^>]+>)/)[1].
      replace(/^<([\w\-]+)/, function(match, nodeName) { return '<' + lowercase(nodeName); });
}
