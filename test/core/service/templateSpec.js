'use strict';

describe('template', function() {
  beforeEach(module('core.test'));

  var $rootElement, $blockTypeFactory, toHtml = angular.mock.dump;

  beforeEach(inject(function(_$blockTypeFactory_, _$rootElement_) {
    $blockTypeFactory = _$blockTypeFactory_;
    $rootElement = _$rootElement_;
  }));


  describe('create', function() {
    it('should create template from HTML', function() {
      var template = $blockTypeFactory('<span>A</span>', []);

      var a = template();
      var b = template();

      expect(a.elements.length).toBe(1);
      expect(b.elements.length).toBe(1);
      expect(toHtml(a.elements)).toEqual('[ <span>A</span> ]');
      expect(toHtml(b.elements)).toEqual('[ <span>A</span> ]');
      expect(a.elements[0]).not.toBe(b.elements[0]);
    });


    it('should create template from DOM', function() {
      $rootElement.html('<span class="id">A</span>')
      var template = $blockTypeFactory($rootElement.find('span'), []);

      var a = template();
      var b = template();

      expect(a.elements.length).toBe(1);
      expect(b.elements.length).toBe(1);
      expect(toHtml(a.elements)).toEqual('[ <span class="id">A</span> ]');
      expect(toHtml(b.elements)).toEqual('[ <span class="id">A</span> ]');
      expect(a.elements[0]).not.toBe(b.elements[0]);
      expect(a.elements[0]).not.toBe($rootElement[0]);
      expect(b.elements[0]).not.toBe($rootElement[0]);
    });
  });
});
