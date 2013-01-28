'use strict';

goog.provide('angular.core.Compile');
goog.provide('angular.core.Compile.factory');
goog.provide('angular.core.DirectivePositions');

goog.require('angular.core.$interpolate');
goog.require('angular.core.Select');

/**
 * @typedef {function((angular.core.NodeList|string)):angular.core.BlockType}
 */
angular.core.Compile;

angular.core.DirectivePositions = TYPE('angular.core.DirectivePositions', function(array) {
  if (!array) return false;

  VAR(array).is(Array);
  ASSERT_EQ(3 * Math.floor(array.length / 3), array.length);
  for (var i = 0, ii = array.length; i < ii;) {
    ASSERT(array[i] >= 0);
    VAR(array[i++]).is(Number);
    VAR(array[i++]).is(Array.of(angular.core.DirectiveDef), null);
    VAR(array[i++]).is(angular.core.DirectivePositions, null);
  }
  return true;
});

/**
 *
 * @constructor
 */
angular.core.Compiler = function($directiveInjector, $blockTypeFactory) {
  this.$directiveInjector = $directiveInjector;
  this.$blockTypeFactory = $blockTypeFactory;
  this.selector = angular.core.selector($directiveInjector.enumerate());
}
angular.annotate.$inject(['$directiveInjector', '$blockTypeFactory'], angular.core.Compiler);

/**
 * @param {angular.core.dom.NodeCursor} domCursor
 * @param {angular.core.dom.NodeCursor} templateCursor
 * @param {Array.<angular.core.BlockCache>} blockCaches
 * @param {Array.<angular.core.DirectiveInfo>=} useExistingDirectiveInfos
 * @return {*}
 */
angular.core.Compiler.prototype.compileBlock = function(domCursor, templateCursor, blockCaches, useExistingDirectiveInfos) {
  VERIFY(arguments,
    ARG('domCursor').is(angular.core.dom.NodeCursor),
    ARG('templateCursor').is(angular.core.dom.NodeCursor),
    ARG('blockCaches').is(Array.of(angular.core.BlockCache)),
    ARG('useExistingDirectiveInfos').is(Array.of(angular.core.DirectiveInfo), undefined));
  ASSERT_EQ(STRINGIFY(domCursor.nodeList()), STRINGIFY(templateCursor.nodeList()));


  var LOG = FN_TRACE('compileBlock', arguments);

  var directivePositions = null; // don't pre-create to create spars tree and prevent GC pressure.

  ASSERT(domCursor.isValid());
  ASSERT(templateCursor.isValid());
  var cursorAlreadyAdvanced;

  do {
    LOG(domCursor, templateCursor);

    var directiveInfos = useExistingDirectiveInfos || this.extractDirectiveInfos(domCursor.nodeList()[0]);
    var compileChildren = true;
    var childDirectivePositions = null;
    var directiveDefs = null;

    cursorAlreadyAdvanced = false;

    ASSERT_EQ(STRINGIFY(domCursor.nodeList()), STRINGIFY(templateCursor.nodeList()));

    for (var j = 0, jj = directiveInfos.length; j < jj; j++) {
      var directiveInfo = directiveInfos[j];
      var DirectiveType = directiveInfo.DirectiveType;
      var blockTypes = null;

      if (DirectiveType.$transclude) {
        var remaindingDirectives = directiveInfos.slice(j + 1);
        var transclusion = this.compileTransclusion(DirectiveType.$transclude,
            domCursor, templateCursor,
            directiveInfo, remaindingDirectives);

        if (transclusion.blockCache) {
          blockCaches.push(transclusion.blockCache);
          cursorAlreadyAdvanced = true;
        }
        blockTypes = transclusion.blockTypes;

        j = jj; // stop processing further directives since they belong to transclusion;
        compileChildren = false;
      }
      if (!directiveDefs) {
        directiveDefs = [];
      }
      directiveDefs.push(new angular.core.DirectiveDef(DirectiveType, directiveInfo.value, blockTypes));
    }

    if (compileChildren && domCursor.descend()) {
      templateCursor.descend();

      childDirectivePositions = compileChildren
          ? this.compileBlock(domCursor, templateCursor, blockCaches)
          : null;

      domCursor.ascend();
      templateCursor.ascend();
    }

    if (childDirectivePositions || directiveDefs) {
      if (!directivePositions) directivePositions = [];
      var directiveOffsetIndex = templateCursor.index;

      if (cursorAlreadyAdvanced) {
        directiveOffsetIndex--;
      }
      directivePositions.push(directiveOffsetIndex, directiveDefs, childDirectivePositions);
    }
  } while (cursorAlreadyAdvanced || (templateCursor.microNext() && domCursor.microNext()));

  return directivePositions;
};

angular.core.Compiler.prototype.compileTransclusion = function(selector, domCursor, templateCursor, directiveInfo,
                                                               transcludedDirectiveInfos) {
  VERIFY(arguments,
    ARG('selector').is(String),
    ARG('domCursor').is(angular.core.dom.NodeCursor),
    ARG('templateCursor').is(angular.core.dom.NodeCursor),
    ARG('directiveInfo').is(angular.core.DirectiveInfo),
    ARG('transcludedDirectiveInfos').is(Array.of(angular.core.DirectiveInfo)));

  var LOG = FN_TRACE('compileTransclusion', arguments);

  var anchorName = directiveInfo.name + (directiveInfo.value ? '=' + directiveInfo.value : '');
  var blockTypes = {};
  var BlockType;
  var blocks;

  var transcludeCursor = templateCursor.replaceWithAnchor(anchorName);
  var groupName = '';
  var domCursorIndex = domCursor.index;
  var directivePositions = this.compileBlock(domCursor, transcludeCursor, [], transcludedDirectiveInfos) || [];

  BlockType = this.$blockTypeFactory(transcludeCursor.elements, directivePositions, groupName);
  domCursor.index = domCursorIndex;
  LOG('BlockType', groupName, transcludeCursor);
  blockTypes[groupName] = BlockType;

  if (domCursor.isInstance()) {
    domCursor.insertAnchorBefore(anchorName);
    blocks = [BlockType(domCursor.nodeList())];
    domCursor.macroNext();
    templateCursor.macroNext();
    while (domCursor.isValid() && domCursor.isInstance()) {
      blocks.push(BlockType(domCursor.nodeList()));
      domCursor.macroNext();
      templateCursor.remove();
    }
  } else {
    domCursor.replaceWithAnchor(anchorName);
  }

  return {blockTypes: blockTypes, blockCache: blocks ? new angular.core.BlockCache(blocks) : null};
};


/**
 * @param {Node} node
 * @return {Array.<angular.core.DirectiveInfo>}
 */
angular.core.Compiler.prototype.extractDirectiveInfos = function (node) {
  VAR(node).is(Node);

  /** @type Array.<angular.core.DirectiveInfo> */
  var directiveInfos = this.selector(node);

  // Resolve the Directive Controllers
  for(var j = 0, jj = directiveInfos.length; j < jj; j++) {
    /** @type {angular.core.DirectiveInfo} */
    var directiveInfo = directiveInfos[j];
    /** @type {angular.core.DirectiveType} */
    var DirectiveType  = this.$directiveInjector.get(directiveInfo.selector);

    if (DirectiveType.$generate) {
      var generatedDirectives = DirectiveType.$generate(directiveInfo.value);
      Array.isArray(Array);

      for (var k = 0, kk = generatedDirectives.length; k < kk; k++) {
        var generatedSelector = generatedDirectives[k][0];
        var generatedValue = generatedDirectives[k][1];
        /** @type {angular.core.DirectiveType} */
        var generatedDirectiveType = this.$directiveInjector.get(generatedSelector);
        /** @type {angular.core.DirectiveInfo} */
        var generatedDirectiveInfo = {
          selector: generatedSelector,
          element: node,
          name: generatedDirectiveType.$name || nextUid(),
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
  directiveInfos.sort(angular.core.Compiler.priorityComparator);
  return directiveInfos
}

/**
 * @param {angular.core.DirectiveInfo} a
 * @param {angular.core.DirectiveInfo} b
 * @return {number}
 */
angular.core.Compiler.priorityComparator = function (a, b) {
  var aPriority = a.DirectiveType.$priority || 0,
      bPriority = b.DirectiveType.$priority || 0;

  return bPriority - aPriority;
}


angular.core.Compile.factory = function($compiler, $blockTypeFactory) {
  return function $compile(elements, blockCaches) {
    VAR(elements).is(angular.core.NodeList);
    VAR(blockCaches).is(undefined, Array.of(angular.core.BlockCache));

    var domElements = elements;
    var templateElements = angular.core.dom.clone(domElements);
    var directivePositions = $compiler.compileBlock(
        new angular.core.dom.NodeCursor(domElements),
        new angular.core.dom.NodeCursor(templateElements),
        blockCaches || []);
    
    VAR(directivePositions).is(angular.core.DirectivePositions);

    return $blockTypeFactory(templateElements, directivePositions);
  };
}
angular.annotate.$inject(['$compiler', '$blockTypeFactory'], angular.core.Compile.factory);
