'use strict';

describe('Block', function() {
  beforeEach(module('core.test'));

  var anchor, $rootElement, $blockTypeFactory;
  var blockCache;

  beforeEach(module(function() {
    return function($blockListFactory, _$blockTypeFactory_, _$rootElement_) {
      $blockTypeFactory = _$blockTypeFactory_;
      $rootElement = _$rootElement_;

      $rootElement.html('<!-- anchor -->');
      anchor = $blockListFactory([$rootElement[0].firstChild], {});
      blockCache = new angular.core.BlockCache();
    }
  }));

  describe('mutation', function() {
    var a, b;

    beforeEach(inject());

    beforeEach(function() {
      a = $blockTypeFactory('<span>A</span>a', [])();
      b = $blockTypeFactory('<span>B</span>b', [])();
    });


    describe('insertAfter', function() {
      it('should insert block after anchor block', function() {
        a.insertAfter(anchor);

        expect($rootElement.html()).toEqual('<!-- anchor --><span>A</span>a');
        expect(anchor.next).toBe(a);
        expect(anchor.previous).toBe(null);
        expect(a.next).toBe(null);
        expect(a.previous).toBe(anchor);
      });


      it('should insert multi element block after another multi element block', function() {
        b.insertAfter(a.insertAfter(anchor));

        expect($rootElement.html()).toEqual('<!-- anchor --><span>A</span>a<span>B</span>b');
        expect(anchor.next).toBe(a);
        expect(anchor.previous).toBe(null);
        expect(a.next).toBe(b);
        expect(a.previous).toBe(anchor);
        expect(b.next).toBe(null);
        expect(b.previous).toBe(a);
      });


      it('should insert multi element block before another multi element block', function() {
        b.insertAfter(anchor);
        a.insertAfter(anchor);

        expect($rootElement.html()).toEqual('<!-- anchor --><span>A</span>a<span>B</span>b');
        expect(anchor.next).toBe(a);
        expect(anchor.previous).toBe(null);
        expect(a.next).toBe(b);
        expect(a.previous).toBe(anchor);
        expect(b.next).toBe(null);
        expect(b.previous).toBe(a);
      });
    });


    describe('remove', function() {
      beforeEach(function() {
        b.insertAfter(a.insertAfter(anchor));

        expect($rootElement.text()).toEqual('AaBb');
      });

      it('should remove the last block', function() {
        b.remove();
        expect($rootElement.html()).toEqual('<!-- anchor --><span>A</span>a');
        expect(anchor.next).toBe(a);
        expect(anchor.previous).toBe(null);
        expect(a.next).toBe(null);
        expect(a.previous).toBe(anchor);
        expect(b.next).toBe(null);
        expect(b.previous).toBe(null);
      });

      it('should remove child blocks from parent pseudo black', function() {
        a.remove();
        expect($rootElement.html()).toEqual('<!-- anchor --><span>B</span>b');
        expect(anchor.next).toBe(b);
        expect(anchor.previous).toBe(null);
        expect(a.next).toBe(null);
        expect(a.previous).toBe(null);
        expect(b.next).toBe(null);
        expect(b.previous).toBe(anchor);
      });

      it('should remove', function() {
        a.remove();
        b.remove();

        var outterAnchor;
        function Directive($anchor) {
          outterAnchor = $anchor;
        }

        var innerBlockType = $blockTypeFactory('<b>text</b>', []);
        var outerBlockType = $blockTypeFactory('<!--start--><!--end-->', [
          0, [new angular.core.DirectiveDef(Directive, '', {'': innerBlockType})], null
        ]);

        var outterBlock = outerBlockType();

        outterBlock.insertAfter(anchor);
        outterAnchor.newBlock().insertAfter(outterAnchor);

        expect($rootElement.text()).toEqual('text');

        outterBlock.remove();

        expect($rootElement.text()).toEqual('');
      });
    });


    describe('moveAfter', function() {
      beforeEach(function() {
        b.insertAfter(a.insertAfter(anchor));

        expect($rootElement.text()).toEqual('AaBb');
      });


      it('should move last to middle', function() {
        b.moveAfter(anchor);
        expect($rootElement.html()).toEqual('<!-- anchor --><span>B</span>b<span>A</span>a');
        expect(anchor.next).toBe(b);
        expect(anchor.previous).toBe(null);
        expect(a.next).toBe(null);
        expect(a.previous).toBe(b);
        expect(b.next).toBe(a);
        expect(b.previous).toBe(anchor);
      });


      it('should move middle to last', function() {
        a.moveAfter(b);
        expect($rootElement.html()).toEqual('<!-- anchor --><span>B</span>b<span>A</span>a');
        expect(anchor.next).toBe(b);
        expect(anchor.previous).toBe(null);
        expect(a.next).toBe(null);
        expect(a.previous).toBe(b);
        expect(b.next).toBe(a);
        expect(b.previous).toBe(anchor);
      });
    });
  });

  //TODO: tests for attach/detach
  //TODO: animation/transitions
  //TODO: tests for re-usability of blocks

});
