'use strict';

goog.provide('angular.core.$compile');

goog.require('angular.coreModule');
goog.require('angular.core.$template');
goog.require('angular.core.$interpolate');

angular.coreModule.factory('$compile', ['$template', '$directiveInjector',
  function($template, $directiveInjector) {
    /**
     *
     * @type {angular.core.Select}
     */
    var selector = angular.core.Selector($directiveInjector.enumerate());

    /**
     * @param {Array.<Element>} elements the elements to compile.
     * @returns {Function}
     */
    function compile(elements) {
      var directives = [];

      walkDOM(elements, directives);

      return $template(elements, directives);
    };

    /**
     * @param {NodeList|Array.<Element>} elements
     * @param {Array} blockDirectives
     */
    function walkDOM(elements, blockDirectives) {
      for(var i = 0, ii = elements.length; i < ii ; i++) {
        var node = elements[i],
            directiveInfos = selector(node),
            compileChildren = true,
            nodeId = null;

        // Resolve the Directive Controllers
        for(var j = 0, jj = directiveInfos.length; j < jj; j++) {
          var directiveInfo = directiveInfos[j];

          directiveInfo.Directive = $directiveInjector.get(directiveInfo.selector);
        }

        // Sort
        // TODO

        // process the directives
        for(var k = 0, kk = directiveInfos.length; k < kk; k++) {
          var directiveInfo = directiveInfos[k],
              Directive = directiveInfo.Directive,
              childNodes,
              $transclude = Directive.$transclude,
              nodeId = null,
              templates;

          if ($transclude) {
            var parent = node.parentNode,
                ownerDocument = node.ownerDocument;

            // stop further processing of directives and stop further compilation.
            k = kk;
            compileChildren = false;

            if (directiveInfo.pseudoElement) {
              // We have to point to the anchor element
              nodeId = markNode(node, i);

              // we have to remove the pseudo children.
              childNodes = removeNodes(parent, directiveInfo.childNodes);
              ii -= childNodes.length;
            } else if ($transclude == '.') {
              // We point to the transcluded element, but it will get replaced with pseudoelement.
              childNodes = [node];
              // create a bogus element
              var pseudoStart = ownerDocument.createComment('[' + directiveInfo.name +
                  (directiveInfo.value ? '=' + directiveInfo.value : directiveInfo.value) + ']');
              var pseudoEnd = ownerDocument.createComment('[/' + directiveInfo.name + ']');

              if (parent) {
                // if we have a parent then replace current node with pseudo nodes
                parent.insertBefore(pseudoStart, node);
                parent.replaceChild(pseudoEnd, node);
              } else {
                // we have no parent, which means we are the root of a template.
                // we need to update the template which was feed to us.
                elements.splice(i, 1, pseudoStart, pseudoEnd);
                i++; // correct index to skip the pseudoEnd.
              }
              nodeId = markNode(pseudoStart, 0);
              i++, ii++; // compensate for new bogus ending element;
              // remove the element which triggered the selector
              node.removeAttribute && node.removeAttribute(directiveInfo.name);
            } else {
              var anchor = ownerDocument.createComment('Anchor:' + directiveInfo.name);
              // clean transclusion content.
              childNodes = removeNodes(node, node.childNodes);
              node.appendChild(anchor);
              nodeId = markNode(anchor, 0);
            }
            // compute the node selector for the anchor
          } else {
            nodeId = markNode(node, i);
          }
          templates = $transclude && compileTransclusions($transclude, childNodes || node.childNodes);
          blockDirectives.push([nodeId, [Directive, directiveInfo.value, templates]]);
        }


        if(compileChildren) {
          walkDOM(node.childNodes, blockDirectives);
        }
      }
    }

    function compileTransclusions(selector, childNodes) {
      if (selector == '.') {
        return compile(childNodes);
      } else {
        var childSelector = angular.core.Selector(selector.split(','), '>'),
            templates = {};

        for (var i = 0, ii = childNodes.length; i < ii; i++) {
          var node = childNodes[i],
              directiveInfos = childSelector(node);

          if (directiveInfos.length) {
            var template = compile([node]);

            for (var j = 0, jj = directiveInfos.length; j < jj; j++) {
              var directiveInfo = directiveInfos[j];

              templates[directiveInfo.name + '=' + directiveInfo.value] = template;
            }
          }
        }
        return templates;
      }
    }

    function removeNodes(parent, childNodes) {
      var removed = [],
          child;

      for(var i = childNodes.length - 1; i >= 0; i--) {
        child = childNodes[i];
        parent.removeChild(child);
        removed.push(child);
      }
      return removed;
    }

    /**
     * Decorate the node with a unique selector id for later reference.
     *
     * @param {Node} node
     * @param {number} index
     */
    function markNode(node, index) {
      var parentNode,
          className,
          match,
          id;

      if (node.nodeType == 1 /* Element */) {
        // we are an element, just mark it.
        className = node.className;
        match = className && className.match(ID_REGEXP);
        if (match) {
          id = match[1];
        } else {
          id = '__ng_' + nextUid();
          node.className = className ? className + ' ' + id : id;
        }
        id = '.' + id;
      } else if (parentNode = node.parentNode) {
        // we have a parent node do parent, then offset.
        id = markNode(parentNode) + '>' + index;
      } else {
        // we have no parent node, we must be compile root so just use offset.
        id = '' + index;
      }
        return id;
    }
    var ID_REGEXP = /\b(__ng_[\d\w]+)\b/;

    return function(element) {
      return compile(isString(element) ? angular.core.$template.htmlToDOM(element) : element);
    };
  }], true);
