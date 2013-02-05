'use strict';

goog.provide('angular.core.$compile');

goog.require('angular.core.$template');
goog.require('angular.core.$interpolate');
goog.require('angular.core.Select');

/**
 * TODO: define
 * @typedef Array
 */
var ElementDirectivesDecl;


angular.core.$compileFactory = function($template, $directiveInjector) {
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
   * @param {Array.<ElementDirectivesDecl>=} elementDirectivesDecls
   */
  function walkDOM(elements, blockDirectives, elementDirectivesDecls) {
    for(var i = 0, ii = elements.length; i < ii ; i++) {
      var node = elements[i],
          elementDirectivesDecl,
          compileChildren = true,
          nodeId = null;

      if (elementDirectivesDecls) {
        elementDirectivesDecl = elementDirectivesDecls[i];
      } else {
        elementDirectivesDecl =  selector(node);

        // Resolve the Directive Controllers
        for(var j = 0, jj = elementDirectivesDecl.length; j < jj; j++) {
          var directiveDecl = elementDirectivesDecl[j];
          var Directive  = $directiveInjector.get(directiveDecl.selector);

          if (Directive.$generate) {
            var generatedDirectives = Directive.$generate(directiveDecl.value);

            for (var k = 0, kk = generatedDirectives.length; k < kk; k++) {
              var generatedDirective = generatedDirectives[k],
                  directiveInfo = shallowCopy(directiveDecl);

              directiveInfo.selector = generatedDirective[0];
              directiveInfo.name = generatedDirective[0];
              directiveInfo.value = generatedDirective[1];

              elementDirectivesDecl.push(directiveInfo);
            }
            jj = elementDirectivesDecl.length;
          }

          directiveDecl.Directive = Directive;
        }
      }

      // Sort
      elementDirectivesDecl.sort(priorityComparator);

      // process the directives
      for(var k = 0, kk = elementDirectivesDecl.length; k < kk; k++) {
        var directiveDecl = elementDirectivesDecl[k],
            Directive = directiveDecl.Directive,
            childNodes,
            $transclude = Directive.$transclude,
            nodeId = null,
            templates,
            transcludedElementDirectivesDecl = null;

        if ($transclude) {
          var parent = node.parentNode,
              ownerDocument = node.ownerDocument;

          compileChildren = false;

          if (directiveDecl.pseudoElement) {
            // We have to point to the anchor element
            nodeId = markNode(node, i);

            // we have to remove the pseudo children.
            childNodes = removeNodes(parent, directiveDecl.childNodes);
            ii -= childNodes.length;
          } else if ($transclude == '.') {
            // We point to the transcluded element, but it will get replaced with pseudoelement.
            childNodes = [node];
            // create a bogus element
            var pseudoStart = ownerDocument.createComment('[' + directiveDecl.name +
                (directiveDecl.value ? '=' + directiveDecl.value : directiveDecl.value) + ']');
            var pseudoEnd = ownerDocument.createComment('[/' + directiveDecl.name + ']');

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
            transcludedElementDirectivesDecl = [ elementDirectivesDecl.slice(k + 1) ];
          } else {
            var anchor = ownerDocument.createComment('Anchor:' + directiveDecl.name);
            // clean transclusion content.
            childNodes = removeNodes(node, node.childNodes);
            node.appendChild(anchor);
            nodeId = markNode(anchor, 0);
          }
          // stop further processing of directives and stop further compilation.
          k = kk;

          // compute the node selector for the anchor
        } else {
          nodeId = markNode(node, i);
        }
        templates = $transclude &&
            compileTransclusions($transclude, childNodes || node.childNodes,
                transcludedElementDirectivesDecl);
        blockDirectives.push([nodeId, [Directive, directiveDecl.value, templates]]);
      }


      if(compileChildren) {
        walkDOM(node.childNodes, blockDirectives);
      }
    }
  }

  /**
   * @param {angular.core.DirectiveInfo} a
   * @param {angular.core.DirectiveInfo} b
   * @return {number}
   */
  function priorityComparator(a, b) {
    var aPriority = a.Directive.$priority || 0,
        bPriority = b.Directive.$priority || 0;

    return aPriority == bPriority ? 0 : (aPriority < bPriority ? 1 : -1);
  }


  /**
   * @param selector
   * @param childNodes
   * @param {Array.<ElementDirectivesDecl>} elementDirectivesDecls
   * @return {*}
   */
  function compileTransclusions(selector, childNodes, elementDirectivesDecls) {
    if (selector == '.') {
      var directives = [];

      walkDOM(childNodes, directives, elementDirectivesDecls);
      return $template(childNodes, directives);
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
   * @param {number=} index
   */
  function markNode(node, index) {
    var parentNode,
        className,
        match,
        id;

    if (node.nodeType == 1 /* Element */) {
      // we are an element, just mark it.

      var element = (/** @type Element */node);

      className = element.className;
      match = className && className.match(ID_REGEXP);
      if (match) {
        id = match[1];
      } else {
        id = '__ng_' + nextUid();
        element.className = className ? className + ' ' + id : id;
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
};

angular.annotate.$inject(['$template', '$directiveInjector'], angular.core.$compileFactory);
