'use strict';

goog.provide('angular.core.Selector');

/**
 * @typedef { function(Node):Array.<angular.core.DirectiveInfo> }
 */
angular.core.Select;

/**
 * @typedef {Object}
 */
angular.core.DirectiveInfo;

/**
 * @param {Array.<string>} selectors the selectors.
 * @param {string=} startWith the required starting character for the selectors.
 * @returns {angular.core.Select} selector function.
 */
angular.core.Selector = function (selectors, startWith) {
  var elementMap = {},
      anyClassMap = {},
      anyAttrMap = {},
      attrSelector = [],
      textSelector = [];

  forEach(selectors, function(selector) {
    var match;

    if (startWith) {
      if (selector.substring(0, startWith.length) == startWith) {
        selector = selector.substring(startWith.length);
      } else {
        throw Error('Selector must start with: ' + startWith + ' was: ' + selector);
      }
    }

    if (match = selector.match(angular.core.Selector.CONTAINS_REGEXP)) {
      textSelector.push({ selector: selector, regexp: new RegExp(match[1])});
    } else if (match = selector.match(angular.core.Selector.ATTR_CONTAINS_REGEXP)) {
      attrSelector.push({ selector: selector, regexp: new RegExp(match[1])});
    } else if (match = selector.match(angular.core.Selector.SELECTOR_REGEXP)){
      var elementName = match[1] || '',
          className = match[2] || '',
          attrName = match[3] || '',
          value = match[4] || '',
          elementAttrMap,
          valueMap;

      if (elementName && !className) {
        elementAttrMap = elementMap[elementName] || (elementMap[elementName] = {}),
        valueMap = elementAttrMap[attrName] || (elementAttrMap[attrName] = {});
        valueMap[value] = selector;
      } else if (attrName && !className && !elementName) {
        valueMap = anyAttrMap[attrName] || (anyAttrMap[attrName] = {});
        valueMap[value] = selector;
      } else if (className && !elementName && !attrName) {
        anyClassMap[className] = selector;
      } else {
        throw new Error('Unsupported Selector: ' + selector);
      }
    } else {
      throw new Error('Unsupported Selector: ' + selector);
    }
  });

  function addDirective(directives, element, selector, name, value, pseudoElement) {
    directives.push({
      selector: selector,
      element: element,
      pseudoElement: pseudoElement,
      childNodes: element.childNodes,
      name: name,
      value: value
    });
  }

  function addAttrDirective(directives, element, valueMap, name, value, pseudoElement) {
    if (valueMap.hasOwnProperty('')) {
      addDirective(directives, element, valueMap[''], name, value, pseudoElement);
    }

    if (valueMap.hasOwnProperty(value)) {
      addDirective(directives, element, valueMap[value], name, value, pseudoElement);
    }
  }

  /**
   * @param {Node} node
   * @returns {Array.<angular.core.DirectiveInfo>}
   */
  function selector(node) {
    var directives = [],
        classNames,
        nodeName = node.nodeName,
        elementAttrMap = elementMap[nodeName.toLowerCase()];

    switch(node.nodeType) {
      case 1: /* Element */
        // Select node
        if (elementAttrMap && elementAttrMap.hasOwnProperty('')) {
          var valueMap = elementAttrMap[''];
          if (valueMap.hasOwnProperty('')) {
            addDirective(directives, node, valueMap['']);
          }
        }

        // Select .name
        if (classNames = node.className) {
          classNames = classNames.split(' ');
          for(var i = 0, ii = classNames.length, name; i < ii; i++) {
            name = classNames[i];
            anyClassMap.hasOwnProperty(name) && addDirective(directives, node, anyClassMap[name], 'class', name);
          }
        }

        // Select [attributes]
        for (var attr, attrs = node.attributes, value, attrName, j = 0, jj = attrs && attrs.length; j < jj; j++) {
          attr = attrs[j];
          if (attr.specified) {
            attrName = attr.name;
            value = attr.value;

            for(var k = 0, kk = attrSelector.length; k < kk; k++) {
              var selectorRegExp = attrSelector[k]

              if (value.match(selectorRegExp.regexp)) {
                // this directive is matched on any attribute name, and so
                // we need to pass the name to the directive by prefixing it to the
                // value. Yes it is a bit of a hack.
                addDirective(directives, node, selectorRegExp.selector, attrName, attrName + '=' + value);
              }
            }

            if (elementAttrMap && elementAttrMap.hasOwnProperty(attrName)) {
              addAttrDirective(directives, node, elementAttrMap[attrName], attrName, value);
            }
            if (anyAttrMap.hasOwnProperty(attrName)) {
              addAttrDirective(directives, node, anyAttrMap[attrName], attrName, value);
            }
          }
        }
        break;
      case 3: /* Text Node */
        for(var value = node.nodeValue, k = 0, kk = textSelector.length; k < kk; k++) {
          var selectorRegExp = textSelector[k]

          if (value.match(selectorRegExp.regexp)) {
            addDirective(directives, node, selectorRegExp.selector, nodeName, value);
          }
        }
        break;
      case 8: /* Comment */
        var match = node.nodeValue.match(angular.core.Selector.COMMENT_COMPONENT_REGEXP);

        if (match) {
          var commentDirectives = [],
              childNodes = [],
              endComment = '[/' + match[1] + ']',
              next = node,
              attrName = match[1],
              attrValue = match[2];

          if (anyAttrMap.hasOwnProperty(attrName)) {
            addAttrDirective(commentDirectives, node, anyAttrMap[attrName], attrName, attrValue, true);
          }

          while(true) {
            next = next.nextSibling;
            if (next) {
              if (next.nodeType == 8 && next.nodeValue == endComment) {
                break;
              } else {
                childNodes.push(next);
              }
            } else {
              throw Error('Missing ending comment: ' + endComment);
            }
          }

          for(var i = 0, ii = commentDirectives.length; i < ii; i++) {
            var directiveInfo = commentDirectives[i];

            directiveInfo.childNodes = childNodes;
            directives.push(directiveInfo);
          }
        }
    }

    return directives;
  }
  return selector;
};

angular.core.Selector.SELECTOR_REGEXP = /^([\w\-]*)(?:\.([\w\-]*))?(?:\[([\w\-]*)(?:=(.*))?\])?$/;
angular.core.Selector.COMMENT_COMPONENT_REGEXP = /^\[([\w\-]+)(?:\=(.*))?\]$/;
angular.core.Selector.CONTAINS_REGEXP = /^:contains\(\/(.+)\/\)$/;
angular.core.Selector.ATTR_CONTAINS_REGEXP = /^\[\*=\/(.+)\/\]$/;
