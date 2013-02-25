'use strict';

goog.provide('angular.core.selector');
goog.provide('angular.core.Html');
goog.provide('angular.core.Select');
goog.provide('angular.core.Selector');
goog.provide('angular.core.DirectiveInfo');

goog.require('angular.core.Directive');


/**
 * @typedef {{
 *   selector: string,
 *   element: Node,
 *   name: string,
 *   value: string,
 *   childNodes: angular.core.NodeList,
 *   DirectiveType: angular.core.DirectiveType
 * }}
 */
angular.core.DirectiveInfo = TYPE('angular.core.DirectiveInfo', function(info) {
  return TYPE.verifyStruct(info, {
     selector: String,
     element: Node,
     name: String,
     value: String,
     childNodes: angular.core.NodeList,
     DirectiveType: angular.core.DirectiveType
  });
});

/**
 * @typedef { function(Node):Array.<angular.core.DirectiveInfo> }
 */
angular.core.SelectorFn;

/**
 * @typedef {string}
 */
angular.core.Selector = TYPE('angular.core.Selector', function(value) {
  return typeof value == 'string';
});

/**
 * @typedef {string}
 */
angular.core.Html;

/**
 * @typedef {{ selector:string, regexp:RegExp  }}
 * @private
 */
angular.core.selector.Info;

/**
 * @param {Array.<string>} selectors the selectors.
 * @param {string=} startWith the required starting character for the selectors.
 * @returns {angular.core.SelectorFn} selector function.
 */
angular.core.selector = function (selectors, startWith) {

  /** @type {Object.<Object.<Object.<string>>>} */
  var elementMap = {};
  /** @type {Object.<Object.<string>>} */
  var anyAttrMap = {};
  /** @type {Object.<string>} */
  var anyClassMap = {};
  /** @type {Array.<angular.core.selector.Info>} */
  var attrSelector = [];
  /** @type {Array.<angular.core.selector.Info>} */
  var textSelector = [];

  forEach(selectors,
      /**
       * @param {string} selector
       */
      function(selector) {
        /** @type {Array.<string>|null} */
        var match;

        if (startWith) {
          if (selector.substring(0, startWith.length) == startWith) {
            selector = selector.substring(startWith.length);
          } else {
            throw Error('Selector must start with: ' + startWith + ' was: ' + selector);
          }
        }

        if (match = selector.match(angular.core.selector.CONTAINS_REGEXP_)) {
          textSelector.push({ selector: selector, regexp: new RegExp(match[1])});
        } else if (match = selector.match(angular.core.selector.ATTR_CONTAINS_REGEXP_)) {
          attrSelector.push({ selector: selector, regexp: new RegExp(match[1])});
        } else if (match = selector.match(angular.core.selector.SELECTOR_REGEXP_)){
          var elementName = match[1] || '',
              className = match[2] || '',
              attrName = match[3] || '',
              value = match[4] || '';
          /** @type {Object.<Object.<string>>} */
          var elementAttrMap;
          /** @type {Object.<string>} */
          var valueMap;

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

  /**
   * @param {Array.<angular.core.DirectiveInfo>} directives
   * @param {Node} element
   * @param {string} selector
   * @param {string=} name
   * @param {string=} value
   */
  function addDirective(directives, element, selector, name, value) {
    directives.push({
      selector: selector,
      element: element,
      childNodes: element.childNodes,
      name: name,
      value: value
    });
  }

  /**
   * @param {Array.<angular.core.DirectiveInfo>} directives
   * @param {Node} element
   * @param {Object.<string>} valueMap
   * @param {string=} name
   * @param {string=} value
   */
  function addAttrDirective(directives, element, valueMap, name, value) {
    if (valueMap.hasOwnProperty('')) {
      addDirective(directives, element, valueMap[''], name, value);
    }

    if (value && valueMap.hasOwnProperty(value)) {
      addDirective(directives, element, valueMap[value], name, value);
    }
  }

  /**
   * @param {Node} node
   * @return {Array.<angular.core.DirectiveInfo>}
   */
  function selector(node) {
    /** @type {Array.<angular.core.DirectiveInfo>} */
    var directiveInfos = [];
    /** @type {Array.<string>} */
    var classNames;
    /** @type {string} */
    var nodeName = node.nodeName;
    /** @type {Object.<Object.<string>>} */
    var elementAttrMap = elementMap[nodeName.toLowerCase()];

    switch(node.nodeType) {
      case 1: /* Element */
        // Select node
        if (elementAttrMap && elementAttrMap.hasOwnProperty('')) {
          var valueMap = elementAttrMap[''];
          if (valueMap.hasOwnProperty('')) {
            addDirective(directiveInfos, node, valueMap['']);
          }
        }

        // Select .name
        if (classNames = node.className) {
          classNames = classNames.split(' ');
          for(var i = 0, ii = classNames.length, name; i < ii; i++) {
            name = classNames[i];
            anyClassMap.hasOwnProperty(name) && addDirective(directiveInfos, node, anyClassMap[name], 'class', name);
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
                addDirective(directiveInfos, node, selectorRegExp.selector, attrName, attrName + '=' + value);
              }
            }

            if (elementAttrMap && elementAttrMap.hasOwnProperty(attrName)) {
              addAttrDirective(directiveInfos, node, elementAttrMap[attrName], attrName, value);
            }
            if (anyAttrMap.hasOwnProperty(attrName)) {
              addAttrDirective(directiveInfos, node, anyAttrMap[attrName], attrName, value);
            }
          }
        }
        break;
      case 3: /* Text Node */
        for(var value = node.nodeValue, k = 0, kk = textSelector.length; k < kk; k++) {
          var selectorRegExp = textSelector[k]

          if (value.match(selectorRegExp.regexp)) {
            addDirective(directiveInfos, node, selectorRegExp.selector, nodeName, value);
          }
        }
        break;
      case 8: /* Comment */
        // TODO (misko) replace with angular.core.dom.pseudoWrap
        var match = node.nodeValue.match(angular.core.selector.COMMENT_COMPONENT_REGEXP_);

        if (match) {
          var commentDirectives = [],
              childNodes = [],
              endComment = '[/' + match[1] + ']',
              next = node,
              attrName = match[1],
              attrValue = match[2];

          if (anyAttrMap.hasOwnProperty(attrName)) {
            addAttrDirective(commentDirectives, node, anyAttrMap[attrName], attrName, attrValue);
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
            directiveInfos.push(directiveInfo);
          }
        }
    }

    return directiveInfos;
  }
  return selector;
};

/** @type {RegExp} @private */
angular.core.selector.SELECTOR_REGEXP_ = /^([\w\-]*)(?:\.([\w\-]*))?(?:\[([\w\-]*)(?:=(.*))?\])?$/;
/** @type {RegExp} @private */
angular.core.selector.COMMENT_COMPONENT_REGEXP_ = /^\[([\w\-]+)(?:\=(.*))?\]$/;
/** @type {RegExp} @private */
angular.core.selector.CONTAINS_REGEXP_ = /^:contains\(\/(.+)\/\)$/;
/** @type {RegExp} @private */
angular.core.selector.ATTR_CONTAINS_REGEXP_ = /^\[\*=\/(.+)\/\]$/;
