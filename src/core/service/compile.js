'use strict';

goog.provide('angular.core.$compile');

goog.require('angular.coreModule');
goog.require('angular.core.$template');
goog.require('angular.core.$interpolate');

/* STRANGE USE CASES

<zippy ng-show="" ng-repeat="" title="{{}}"></zippy>
expected order: ng-repeat, ng-show, zippy (title),
ng-show has nothing to hide when zippy replaces content

<div ng-switch>
  <div ng-switch-when></div>
  <div ng-switch-when></div>
  <div ng-switch-default></div>
</div>

ngRepeat = {
  priority: 1000,
  transclude: '.'
}

ngSwitch = {
  transclude: [ '>[ngSwitchWhen]', '>[ngSwitchDefault]']
}

ngHide = {
  transclude: '.'
}


 */

angular.core.$compile.SELECTOR_REGEXP = /^([\w\-]*)(?:\.([\w\-]*))?(?:\[([\w\-]*)(?:=(.*))?\])?$/;
angular.core.$compile.COMMENT_COMPONENT_REGEXP = /^\[([\w\-]+)(?:\=(.*))?\]$/;

angular.coreModule.factory('$compile', ['$template', '$directiveInjector', '$interpolate',
  function($template, $directiveInjector, $interpolate) {
    var directiveMap;

    /**
     * @param {Array.<Element>} elements the elements to compile.
     * @param {Object=} preventRecursion prevents recursion.
     * @returns {Function}
     */
    function compile(elements, preventRecursion) {
      var directives = [];

      walkDOM(elements, directives, preventRecursion);

      return $template(elements, directives);
    };

    // TODO: preventRecursion should be the selector, where we remove already processed component
    /**
     * @param {NodeList|Array.<Element>} elements
     * @param {Array} blockDirectives
     * @param {Object=} preventRecursion
     */
    function walkDOM(elements, blockDirectives, preventRecursion) {
      var parentId;

      for(var i = 0, ii = elements.length; i < ii ; i++) {
        var node = elements[i],
            selector = selectNode(directiveMap, node, preventRecursion, $directiveInjector),
            directives = selector.directives,
            recurse = true,
            directive;

        if (directive = selector.component) {
          if (!preventRecursion) preventRecursion = {};
          preventRecursion[selector.cName] = true;
          var componentNodes = selector.cNodes,
              transcludeSelector = directive.$transclude,
              transcludeSelf = transcludeSelector == '.',
              selectorPath,
              templates;

          recurse = false;
          if (componentNodes) {
            // correct for the bogus element
            var parentNode = node.parentNode;
            for(var k = 0, kk = componentNodes.length; k < kk; k++) {
              parentNode.removeChild(componentNodes[k]);
              ii--;
            }
            i++; // skip the end element
          }

          if (transcludeSelf) {
            var parent = node.parentNode,
                ownerDocument = node.ownerDocument;

            if (componentNodes) {
              selectorPath = getSelectId(node, i, true);
            } else {
              selectorPath = getSelectId(node, i, true);
              // create a bogus element
              parent.insertBefore(ownerDocument.createComment('[' + selector.cName + '=' + selector.cValue + ']'), node);
              parent.replaceChild(ownerDocument.createComment('[/' + selector.cName + ']'), node);
              i++, ii++; // compensate for new bogus ending element;
              componentNodes = [node];
            }
            templates = compile(componentNodes, preventRecursion);
          } else {
            if (componentNodes) {
              throw Error('implement: switch made from comments');
            } else {
              templates = transcludeChildren(node.childNodes || [node], directive.$transclude, preventRecursion);
              node.innerHTML = '<!--Anchor:' + selector.cName + '-->';
              selectorPath = getSelectId(node.firstChild, 0, true);
            }
          }

          blockDirectives.push([selectorPath, [directive, selector.cValue, templates]]);
        } else if (directives) {
          directives.unshift(getSelectId(node, i));
          blockDirectives.push(directives);
        }

        if(recurse) {
          walkDOM(node.childNodes, blockDirectives);
        }
      }
    }

    function transcludeChildren(childNodes, transcludeSelector, preventRecursion) {
      var transcludeMap = {},
          directiveMap = createSelectorMap(transcludeSelector.split(','), '>');

      for(var i = 0, ii = childNodes.length; i < ii; i++) {
        var childNode = childNodes[i],
            selector = selectNode(directiveMap, childNode),
            directives = selector.directives,
            template = directives && compile([childNode]);

        if (directives) {
          for(var j = 0, jj = directives.length; j < jj; j++) {
            transcludeMap[directives[j][0]] = template;
            transcludeMap[directives[j][0].replace(/\]$/, '=' + directives[j][1] + ']')] = template;
          }
        }
      }
      return transcludeMap;
    }

    // TODO: do we actually need preventRecursion???
    /**
     * @param {Object} directiveMap
     * @param {Element} node
     * @param {Object=} preventRecursion
     * @param {Function=} injector
     */
    function selectNode(directiveMap, node, preventRecursion, injector) {
      var attrMap = directiveMap[node.nodeName.toLowerCase()],
          attrMapAny = directiveMap[''] || EMPTY_MAP,
          classMap = directiveMap['.'] || EMPTY_MAP,
          valueMap,
          directives,
          directiveName,
          interpolateFn,
          classNames,
          match;

      // Select element[*]
      if (attrMap && (valueMap = attrMap['']) && (directiveName = valueMap['']) ) {
        addDirective(directiveName);
      }
      valueMap = false;

      // Process the element
      switch(node.nodeType) {
        case 1: /* Element */
          // Select .name
          if (classNames = node.className) {
            classNames = classNames.split(' ');
            for(var i = 0, ii = classNames.length, name; i < ii; i++) {
              name = classNames[i];
              classMap.hasOwnProperty(name) && addDirective(classMap[name], name);
            }
          }

          // Select [attributes]
          for (var attr, attrs = node.attributes, value, j = 0, jj = attrs && attrs.length; j < jj; j++) {
            attr = attrs[j];
            if (attr.specified) {
              value = attr.value;

              if (interpolateFn = $interpolate(value, true)) {
                addDirective(['$attr_'+attr.name, '$value', interpolateSetter], null, interpolateFn);
              }

              selector(attr.name, value);
            }
          }
          break;
        case 3: /* Text Node */
          if (interpolateFn = $interpolate(node.nodeValue, true)) {
            addDirective(['$text', '$value', interpolateSetter], null, interpolateFn);
          }
          break;
        case 8: /* Comment */
          if (match = node.nodeValue.match(angular.core.$compile.COMMENT_COMPONENT_REGEXP)) {
            var nodes = selector.cNodes = [],
                endComment = '[/' + match[1] + ']',
                next = node;

            selector(match[1], match[2]);

            while(true) {
              next = next.nextSibling;
              if (next) {
                if (next.nodeType == 8 && next.nodeValue == endComment) {
                  break;
                } else {
                  nodes.push(next);
                }
              } else {
                throw Error('Missing ending comment ' + endComment);
              }
            }
          }
      }


      // TODO: clean up the arguments and this function
      /**
       * @param {Object|string} directiveName the name of the directive.
       * @param {?string=} aName
       * @param {?string=} aValue
       */
      function addDirective(directiveName, aName, aValue) {
        if (!preventRecursion || !preventRecursion.hasOwnProperty(aName)) {
          var directive = (injector && typeof directiveName == 'string')
              ? $directiveInjector.get(directiveName) : directiveName;

          if (directive.$transclude) {
            if(selector.cName) {
              throw new Error('Only one component is allowed per element. First: ' + selector.cId +
                  ' Second: ' + directiveName.id);
            }
            selector.component = directive;
            selector.cName = aName;
            selector.cValue = aValue;
            selector.cId = directiveName.id;
          } else {
            if (!directives) {
              selector.directives = directives = [];
            }
            directives.push([directive, aValue]);
          }
        }
      }

      function selector(aName, aValue) {
        directiveName = attrMap && attrMap.hasOwnProperty(aName) && (valueMap = attrMap[aName])[aValue];
        directiveName && addDirective(directiveName, aName, aValue);
        directiveName = valueMap && valueMap[''];
        directiveName && addDirective(directiveName, aName, aValue);
        valueMap = false;

        directiveName = attrMapAny && attrMapAny.hasOwnProperty(aName) && (valueMap = attrMapAny[aName])[aValue];
        directiveName && addDirective(directiveName, aName, aValue);
        directiveName = valueMap && valueMap[''];
        directiveName && addDirective(directiveName, aName, aValue);
        valueMap = false;

        return selector;
      }

      return selector;
    }


    /**
     * @param {Element} node
     * @param {number} index
     * @param {boolean=} forceParent
     */
    function getSelectId(node, index, forceParent) {
      var id = '__ng_' + nextUid(),
          isElement = !forceParent && node.nodeType == 1 /* Element */,
          element = isElement ? node : node.parentNode,
          className = element.className;

      element.className = className ? className + ' ' + id : id;
      id = '.' + id;
      if (!isElement) id = id + '>' + index;

      return id;
    }

    directiveMap = createSelectorMap($directiveInjector.enumerate());

    /**
     * @param {Array.<string>} selectors the selectors.
     * @param {string=} startWith the required starting character for the selectors.
     * @return {Object.<Element,*>}
     */
    function createSelectorMap(selectors, startWith) {
      var selectorMap = {};

      forEach(selectors, function(selector) {
        if (startWith) {
          if (selector.charAt(0) != startWith) {
            throw Error('TEST ME!!! Selector must start with: ' + startWith + ' was: ' + selector);
          }
          selector = selector.substr(startWith.length);
        }

        var elementAttrValue = assertArg(selector.match(angular.core.$compile.SELECTOR_REGEXP), selector, 'not valid selector.'),
            element = elementAttrValue[1] || '',
            className = elementAttrValue[2] || '',
            attr = elementAttrValue[3] || '',
            value = elementAttrValue[4] || '',
            attrMap,
            valueMap,
            classMap;

        if(element || attr || value) {
          attrMap = selectorMap[element] || (selectorMap[element] = {});
          valueMap = attrMap[attr] || (attrMap[attr] = {});
          valueMap[value] = selector;
        } else if (className) {
          classMap = selectorMap['.'] || (selectorMap['.'] = {});
          classMap[className] = selector;
        }
      });
      return selectorMap;
    };

    function interpolateSetter(setter, interpolateFn) {
      this.attach = function(scope) {
        setter('');
        scope.$watch(interpolateFn, setter);
      }
    }
    return function(element) {
      return compile(isString(element) ? angular.core.$template.htmlToDOM(element) : element);
    };
  }], true);
