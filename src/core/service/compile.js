'use strict';

goog.provide('angular.core.Compile');
goog.provide('angular.core.Compile.factory');

goog.require('angular.core.$interpolate');
goog.require('angular.core.Select');

/**
 * @typedef {function((angular.core.NodeList|string)):angular.core.BlockType}
 */
angular.core.Compile;

/**
 *
 * @param {angular.core.BlockTypeFactory} $blockTypeFactory
 * @param {angular.Injector} $directiveInjector
 * @return {angular.core.Compile}
 */
angular.core.Compile.factory = function($blockTypeFactory, $directiveInjector) {
  /** @type {angular.core.SelectorFn} */
  var selector = angular.core.selector($directiveInjector.enumerate());

  /**
   * @param {angular.core.NodeList} elements Elements to compile.
   * @param {Array.<angular.core.BlockCache>=} blockCache
   * @returns {angular.core.BlockType}
   */
  function compile(elements, blockCache) {
    VERIFY(arguments,
      ARG('elements').is(angular.core.NodeList),
      ARG('blockCache').is(ARRAY(angular.core.BlockCache), undefined));

    /** @type Array.<angular.core.NodeDirectiveDef> */
    var directives = [];

    walkDOM(elements, directives, blockCache);
    return $blockTypeFactory(elements, directives);
  };

  /**
   * @param {angular.core.NodeList} elements
   * @param {Array.<angular.core.NodeDirectiveDef>} nodeDirectiveDefs
   * @param {Array.<angular.core.BlockCache>=} blockCache
   * @param {Array.<angular.core.DirectiveInfo>=} useExistingDirectiveInfos
   */
  function walkDOM(elements, nodeDirectiveDefs, blockCache, useExistingDirectiveInfos) {
    for(var i = 0, ii = elements.length; i < ii ; i++) {
      /** @type {Node} */
      var node = elements[i];
      /** @type {Array.<angular.core.DirectiveInfo>} */
      var nodeDirectiveInfos = useExistingDirectiveInfos || extractDirectiveInfos(node);
      /** @type {boolean} */
      var compileChildren = true;

      // Sort
      nodeDirectiveInfos.sort(priorityComparator);

      // process the directives
      for(var k = 0, kk = nodeDirectiveInfos.length; k < kk; k++) {
        /** @type {angular.core.DirectiveInfo} */
        var nodeDirectiveInfo = nodeDirectiveInfos[k];
        /** @type {angular.core.DirectiveType} */
        var nodeDirectiveType = nodeDirectiveInfo.DirectiveType;
        /** @type {Array.<angular.core.DirectiveInfo>} */
        var transcludedDirectiveInfos = null;
        /** @type {angular.core.NodeList} */
        var childNodes;
        /** @type {?string} */
        var nodeId = null;

        if (nodeDirectiveType.$transclude) {
          /** @type {Node} */
          var parent = node.parentNode;
          /** @type {Document} */
          var ownerDocument = node.ownerDocument;

          compileChildren = false;

          if (nodeDirectiveInfo.pseudoElement) {
            // We have to point to the anchor element
            nodeId = markNode(node, i);

            // we have to remove the pseudo children.
            childNodes = removeNodes(parent, nodeDirectiveInfo.childNodes);
            ii -= childNodes.length;
          } else if (nodeDirectiveType.$transclude == '.') {
            // We point to the transcluded element, but it will get replaced with pseudoelement.
            childNodes = [node];
            // create a bogus element
            var pseudoStart = ownerDocument.createComment('[' + nodeDirectiveInfo.name +
                (nodeDirectiveInfo.value ? '=' + nodeDirectiveInfo.value : nodeDirectiveInfo.value) + ']');
            var pseudoEnd = ownerDocument.createComment('[/' + nodeDirectiveInfo.name + ']');

            if (parent) {
              // if we have a parent then replace current node with pseudo nodes
              parent.insertBefore(pseudoStart, node);
              if (blockCache) {
                blockCache.push(new angular.core.BlockCache([

                ]));
              } else {
                parent.replaceChild(pseudoEnd, node);
              }
            } else {
              // we have no parent, which means we are the root of a template.
              // we need to update the template which was feed to us.
              elements.splice(i, 1, pseudoStart, pseudoEnd);
              i++; // correct index to skip the pseudoEnd.
            }
            nodeId = markNode(pseudoStart, 0);
            i++, ii++; // compensate for new bogus ending element;
            transcludedDirectiveInfos = nodeDirectiveInfos.slice(k + 1);
          } else {
            var anchor = ownerDocument.createComment('Anchor:' + nodeDirectiveInfo.name);
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
        /** @type {Object.<angular.core.BlockType>} */
        var templates = /** @type {angular.core.BlockType} */ (nodeDirectiveType.$transclude &&
            compileTransclusions(nodeDirectiveType.$transclude, childNodes || node.childNodes,
                transcludedDirectiveInfos));
        VAR(templates).is(OBJECT(angular.core.BlockType), undefined);
        //TODO (misko): this is wrong. it needs to be outside this loop. Inside
        // this loop it will cause multiple directives on the same element to have multiple
        // seloctors, and will force the selction process to be run too many times.
        // making it slow.
        nodeDirectiveDefs.push(
            new angular.core.NodeDirectiveDef(nodeId, [
              new angular.core.DirectiveDef(nodeDirectiveType, nodeDirectiveInfo.value, templates)
            ]));
      }


      if(compileChildren) {
        walkDOM(node.childNodes, nodeDirectiveDefs);
      }
    }
  }

  /**
   * @param {Node} node
   * @return {Array.<angular.core.DirectiveInfo>}
   */
  function extractDirectiveInfos(node) {
    /** @type Array.<angular.core.DirectiveInfo> */
    var directiveInfos = selector(node);

    // Resolve the Directive Controllers
    for(var j = 0, jj = directiveInfos.length; j < jj; j++) {
      /** @type {angular.core.DirectiveInfo} */
      var directiveInfo = directiveInfos[j];
      /** @type {angular.core.DirectiveType} */
      var DirectiveType  = $directiveInjector.get(directiveInfo.selector);

      if (DirectiveType.$generate) {
        var generatedDirectives = DirectiveType.$generate(directiveInfo.value);
        Array.isArray(Array);

        for (var k = 0, kk = generatedDirectives.length; k < kk; k++) {
          var generatedSelector = generatedDirectives[k][0];
          var generatedValue = generatedDirectives[k][1];
          /** @type {angular.core.DirectiveType} */
          var generatedDirectiveType = $directiveInjector.get(generatedSelector);
          /** @type {angular.core.DirectiveInfo} */
          var generatedDirectiveInfo = {
            selector: generatedSelector,
            element: node,
            pseudoElement: false,
            name: generatedDirectiveType.$name,
            value: generatedValue,
            childNodes: /** @type {angular.core.NodeList} */(node.childNodes),
            DirectiveType: null
          };

          directiveInfos.push(generatedDirectiveInfo);
        }
        jj = directiveInfos.length;
      }

      directiveInfo.DirectiveType = DirectiveType;
    }
    return directiveInfos
  }


  /**
   * @param {angular.core.DirectiveInfo} a
   * @param {angular.core.DirectiveInfo} b
   * @return {number}
   */
  function priorityComparator(a, b) {
    var aPriority = a.DirectiveType.$priority || 0,
        bPriority = b.DirectiveType.$priority || 0;

    return bPriority - aPriority;
  }


  /**
   * @param {string} selector
   * @param {angular.core.NodeList} childNodes
   * @param {Array.<angular.core.DirectiveInfo>} userExistingDirectiveInfos
   * @return {Object.<angular.core.BlockType>}
   */
  function compileTransclusions(selector, childNodes, userExistingDirectiveInfos) {
    if (selector == '.') {
      /** @type Array.<angular.core.NodeDirectiveDef> */
      var directives = [];

      walkDOM(childNodes, directives, null, userExistingDirectiveInfos);
      return {'': $blockTypeFactory(childNodes, directives)};
    } else {
      /** @type {angular.core.SelectorFn} */
      var childSelector = angular.core.selector(selector.split(','), '>');
      /** @type {Object.<angular.core.BlockType>} */
      var blockTypes = {};

      for (var i = 0, ii = childNodes.length; i < ii; i++) {
        /** @type {Node} */
        var node = childNodes[i];
        /** @type {Array.<angular.core.DirectiveInfo>} */
        var directiveInfos = childSelector(node);

        if (directiveInfos.length) {
          /** @type {angular.core.BlockType} */
          var BlockType = compile([node]);

          for (var j = 0, jj = directiveInfos.length; j < jj; j++) {
            /** @type {angular.core.DirectiveInfo} */
            var directiveInfo = directiveInfos[j];

            blockTypes[directiveInfo.name + '=' + directiveInfo.value] = BlockType;
          }
        }
      }
      return blockTypes;
    }
  }

  /**
   *
   * @param {Node} parent
   * @param {angular.core.NodeList} childNodes
   * @return {angular.core.NodeList}
   */
  function removeNodes(parent, childNodes) {
    /** @type {angular.core.NodeList} */
    var removed = [];
    /** @type {Node} */
    var child;

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
   * @return {string}
   */
  function markNode(node, index) {
    /** @type {Node} */
    var parentNode;
    /** @type {string} */
    var className;
    /** @type {Array.<string>} */
    var match;
    /** @type {string} */
    var id;

    if (node.nodeType == 1 /* Element */) {
      // we are an element, just mark it.

      var element = /** @type Element */(node);

      className = element.className;
      match = /** @type {Array.<string>} */(className && className.match(ID_REGEXP));
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

  /**
   * @param {angular.core.NodeList|string} element
   * @param {Array.<angular.core.BlockCache>=} blockCache
   * @return {angular.core.BlockType}
   */
  return function(element, blockCache) {
    return compile(
        isString(element)
          ? angular.core.dom.htmlToDOM(/** @type {string} */(element))
          : /** @type {angular.core.NodeList} */(element),
        blockCache);
  };
};

angular.annotate.$inject(['$blockTypeFactory', '$directiveInjector'], angular.core.Compile.factory);
