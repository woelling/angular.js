'use strict';

goog.require('angular.coreModule');
goog.require('angular.core.$rootScope');
goog.require('angular.core.$exceptionHandler');
goog.require('angular.core.$Block');

goog.provide('angular.core.$template');

angular.coreModule.factory('$template', ['$rootElement', '$injector', '$exceptionHandler', '$Block',
  function($rootElements,   $injector,   $exceptionHandler, Block) {
    return function template(templateSelector, directiveDefs) {
      if (!directiveDefs) directiveDefs = EMPTY_ARRAY;

      var templateElements = extractTemplate(templateSelector, directiveDefs);
      ASSERT(templateElements && templateElements.length != undefined);

      return function block(blockSelectorHtmlOrElements, collectionsBlocks) {
        var blockElements = blockSelectorHtmlOrElements
            ? (typeof blockSelectorHtmlOrElements == 'string'
            ? angular.core.$template.select($rootElements, blockSelectorHtmlOrElements)
            : blockSelectorHtmlOrElements)
            : clone(templateElements);

        return new Block(blockElements, directiveDefs, collectionsBlocks);
      }
    };


    function extractTemplate(selector, directiveDefs) {
      if (typeof selector == 'string') {
        var elements = clone(angular.core.$template.select($rootElements, selector));

        // remove the hole contents
        for(var i = 0, ii = directiveDefs.length; i < ii; i++) {
          var elementDirectiveDefs = directiveDefs[i];

          if (elementDirectiveDefs[1].length == 3 /* is component */) {
            var holeElements = angular.core.$template.select(elements, elementDirectiveDefs[0]),
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


    function clone(elements) {
      var cloneElements = [],
          i = 0, ii = elements.length;

      ASSERT(ii);

      for(; i < ii; i++) {
        cloneElements[i] = elements[i].cloneNode(true);
      }
      return cloneElements;
    }
  }]);


angular.core.$template.select = function (roots, selector) {
  assertArg(roots);
  assertArg(selector);

  var match = angular.core.$template.select.SELECTOR_REGEX.exec(selector);

  if (!match) {
    if (selector.charAt(0) == '<') {
      return angular.core.$template.htmlToDOM(selector);
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
    var rootElement = roots[i];

    if (match[1] === '.') {
      // select the current element
      foundElement = roots[0];
    } else if (rootElement.className.indexOf(match[2]) != -1)  {
      // select element if class matches
      foundElement = rootElement;
    } else {
      // select elements using querySelector
      foundElement = rootElement.querySelector(match[1]);
    }
  }

  if (!foundElement) assertSelector(selector, roots);

  if (offset !== false) {
    foundElement = foundElement.firstChild;
    if (!foundElement) assertSelector(selector, roots);
    while(offset--) {
      if (!foundElement) assertSelector(selector, roots);

      foundElement = foundElement.nextSibling;
    }
  }

  do {
    if (!foundElement) assertSelector(selector, roots);
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
angular.core.$template.select.SELECTOR_REGEX = /^(\.([^+>]*))?(\>?(\d+))?(\+(\d+))?$/;

function assertSelector(selector, roots) {
  throw new Error('Can not select: ' + selector + ' ' + startingTag(roots[0]));
}

/**
 * @returns {string} Returns the string representation of the element.
 */
function startingTag(element) {
  var html = element.outerHTML || '';
  return html.
      match(/^(<[^>]+>)/)[1].
      replace(/^<([\w\-]+)/, function(match, nodeName) { return '<' + lowercase(nodeName); });
}


// Read about the NoScope elements here:
// http://msdn.microsoft.com/en-us/library/ms533897(VS.85).aspx
var IE_NO_SCOPE_WORKAROUND = '<div>&#160;</div>';
var NODE_NAME_REGEXP = /\<([\w\d\-\_\:]+)/;
var NO_WRAP    = [ 0, "",                             "" ];
var TABLE_WRAP = [ 1, "<table>",                      "</table>" ];
var TBODY_WRAP = [ 2, "<table><tbody>",               "</tbody></table>" ];
var TR_WRAP    = [ 3, "<table><tbody><tr>",           "</tr></tbody></table>" ];
var PARENT_NODE = {
  'option':      [ 1, "<select multiple='multiple'>", "</select>" ],
  'legend':      [ 1, "<fieldset>",                   "</fieldset>" ],
  'thead':       TABLE_WRAP,
  'tbody':       TABLE_WRAP,
  'tfoot':       TABLE_WRAP,
  'colgroup':    TABLE_WRAP,
  'tr':          TBODY_WRAP,
  'th':          TR_WRAP,
  'td':          TR_WRAP,
  'col':         [ 2, "<table><colgroup>",            "</colgroup></table>" ],
  'area':        [ 1, "<map>", "</map>" ]
};
angular.core.$template.htmlToDOM = function(html) {
  var nodeMatch = html.match(NODE_NAME_REGEXP),
      nodeName = nodeMatch && nodeMatch[1],
      wrap = PARENT_NODE[lowercase(nodeName)] || NO_WRAP,
      depth = wrap[0],
      pre = wrap[1],
      post = wrap[2],
      div = document.createElement('div'),
      nodes = [],
      childNodes;

  // Read about the NoScope elements here:
  // http://msdn.microsoft.com/en-us/library/ms533897(VS.85).aspx
  div.innerHTML = IE_NO_SCOPE_WORKAROUND + pre  + html + post;
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
