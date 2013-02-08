'use strict';

goog.provide('angular.core.dom.clone');
goog.provide('angular.core.dom.extractTemplate');
goog.provide('angular.core.dom.htmlToDOM');
goog.provide('angular.core.dom.select');

angular.core.dom.clone = function (elements) {
  var cloneElements = [],
      i = 0, ii = elements.length;

  ASSERT(ii);

  for(; i < ii; i++) {
    cloneElements[i] = elements[i].cloneNode(true);
  }
  return cloneElements;
}

angular.core.dom.extractTemplate = function (rootElement, selector, directiveDefs) {
  if (typeof selector == 'string') {
    var elements = angular.core.dom.clone(angular.core.dom.select(rootElement, selector));

    // remove the hole contents
    for(var i = 0, ii = directiveDefs.length; i < ii; i++) {
      var elementDirectiveDefs = directiveDefs[i];

      if (elementDirectiveDefs[1].length == 3 /* is component */) {
        var holeElements = angular.core.dom.select(elements, elementDirectiveDefs[0]),
            parentNode = holeElements[0].parentNode;

        // assume first element is anchor and remove the rest
        for(var j = 1, jj = holeElements.length; j < jj; j++) {
          parentNode.removeChild(holeElements[j]);
        }
        // strip span from hole selectors
        elementDirectiveDefs[0] = elementDirectiveDefs[0].replace(/\+\d+$/, '');
      }
    }

    return elements;
  } else {
    // assume that it is array of elements
    return selector;
  }
}




angular.core.dom.htmlToDOM = function(html) {
  var nodeMatch = html.match(angular.core.dom.htmlToDOM.NODE_NAME_REGEXP),
      nodeName = nodeMatch && nodeMatch[1],
      wrap = angular.core.dom.htmlToDOM.PARENT_NODE[lowercase(nodeName)] ||
          angular.core.dom.htmlToDOM.NO_WRAP,
      depth = wrap[0],
      pre = wrap[1],
      post = wrap[2],
      div = document.createElement('div'),
      nodes = [],
      childNodes;

  // Read about the NoScope elements here:
  // http://msdn.microsoft.com/en-us/library/ms533897(VS.85).aspx
  div.innerHTML = angular.core.dom.htmlToDOM.IE_NO_SCOPE_WORKAROUND + pre  + html + post;
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
angular.core.dom.htmlToDOM.IE_NO_SCOPE_WORKAROUND = '<div>&#160;</div>';
angular.core.dom.htmlToDOM.NODE_NAME_REGEXP = /\<([\w\d\-\_\:]+)/;
angular.core.dom.htmlToDOM.NO_WRAP    = [ 0, "",                   "" ];
angular.core.dom.htmlToDOM.TABLE_WRAP = [ 1, "<table>",            "</table>" ];
angular.core.dom.htmlToDOM.TBODY_WRAP = [ 2, "<table><tbody>",     "</tbody></table>" ];
angular.core.dom.htmlToDOM.TR_WRAP    = [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ];
angular.core.dom.htmlToDOM.PARENT_NODE = {
  'option':      [ 1, "<select multiple='multiple'>", "</select>" ],
  'legend':      [ 1, "<fieldset>",                   "</fieldset>" ],
  'thead':       angular.core.dom.htmlToDOM.TABLE_WRAP,
  'tbody':       angular.core.dom.htmlToDOM.TABLE_WRAP,
  'tfoot':       angular.core.dom.htmlToDOM.TABLE_WRAP,
  'colgroup':    angular.core.dom.htmlToDOM.TABLE_WRAP,
  'tr':          angular.core.dom.htmlToDOM.TBODY_WRAP,
  'th':          angular.core.dom.htmlToDOM.TR_WRAP,
  'td':          angular.core.dom.htmlToDOM.TR_WRAP,
  'col':         [ 2, "<table><colgroup>",            "</colgroup></table>" ],
  'area':        [ 1, "<map>", "</map>" ]
};


angular.core.dom.select = function (roots, selector) {
  assertArg(roots);
  assertArg(selector);

  var match = angular.core.dom.select.SELECTOR_REGEX.exec(selector);

  if (!match) {
    if (selector.charAt(0) == '<') {
      return angular.core.dom.htmlToDOM(selector);
    } else {
      throw new Error('Unsupported selector: ' + selector);
    }
  }

  var foundElement,
      offset = match[3] ? match[4] * 1 : false,
      span = match[6] * 1 || 0,
      elements = [];

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
angular.core.dom.select.SELECTOR_REGEX = /^(\.([^+>]*))?(\>?(\d+))?(\+(\d+))?$/;

angular.core.dom.select.assert = function(selector, roots) {
  throw new Error('Can not select: ' + selector + ' ' + angular.core.dom.startingTag(roots[0]));
}

/**
 * @returns {string} Returns the string representation of the element.
 */
angular.core.dom.startingTag = function (element) {
  var html = element.outerHTML;
  return html && html.
      match(/^(<[^>]+>)/)[1].
      replace(/^<([\w\-]+)/, function(match, nodeName) { return '<' + lowercase(nodeName); });
}
