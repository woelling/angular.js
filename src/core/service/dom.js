'use strict';

goog.provide('angular.core.dom.clone');
goog.provide('angular.core.dom.extractTemplate');
goog.provide('angular.core.dom.htmlToDOM');
goog.provide('angular.core.dom.select');

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

/**
 * @param {angular.core.NodeList} templateElement
 * @param {Array.<angular.core.NodeDirectiveDef>} nodeDirectiveDefs
 * @return {angular.core.NodeList}
 */
angular.core.dom.extractTemplate = function (templateElement, nodeDirectiveDefs) {
  VERIFY(arguments,
    ARG('templateElement').is(angular.core.NodeList),
    ARG('nodeDirectiveDefs').is(ARRAY(angular.core.NodeDirectiveDef)));

  /** @type {angular.core.NodeList} */
  var clonedElements = angular.core.dom.clone(templateElement);

  // remove the hole contents
  for(var i = 0, ii = nodeDirectiveDefs.length; i < ii; i++) {
    /** @type {angular.core.NodeDirectiveDef} */
    var nodeDirectiveDef = nodeDirectiveDefs[i];

    VAR(nodeDirectiveDef).is(angular.core.NodeDirectiveDef);
    for (var directiveDefs = nodeDirectiveDef.directiveDefs,
         j = 0, jj = directiveDefs.length; j < jj; j++) {
      /** @type {angular.core.DirectiveDef} */
      var directiveDef = directiveDefs[j];

      VAR(directiveDef).is(angular.core.DirectiveDef);
      if (directiveDef.isComponent()) {
        /** @type {angular.core.NodeList} */
        var holeElements = angular.core.dom.select(clonedElements, nodeDirectiveDef.selector);
        /** @type {Element} */
        var parentNode = holeElements[0].parentNode;

        // assume first element is anchor and remove the rest
        for(var j = 1, jj = holeElements.length; j < jj; j++) {
          parentNode.removeChild(holeElements[j]);
        }
        // strip span from hole selectors
        nodeDirectiveDef.stripSpan();
      }
    }
  }

  return clonedElements;
}


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
