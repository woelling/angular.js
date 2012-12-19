'use strict';

describe('Selector', function() {
  var log;
  var selector;
  var element;
  var e = function(html) {
    return  element = angular.core.$template.htmlToDOM(html)[0];
  }

  beforeEach(module(function($provide) {
    log = [];
    $provide.value({
      'directive:b': noop,
      'directive:.b': noop,
      'directive:[directive]': noop,
      'directive:b[directive]': noop,
      'directive:[directive=value]': noop,
      'directive:b[directive=value]': noop,
      'directive::contains(/abc/)': noop,
      'directive:[*=/xyz/]': noop
    });

  }));
  beforeEach(inject(function($directiveInjector) {
    selector = angular.core.Selector($directiveInjector.enumerate());
  }));

  it('should match directive on element', function() {
    expect(selector(e('<b></b>'))).toEqual([
      {selector: 'b', value: undefined, element: element, childNodes: element.childNodes, name: undefined, pseudoElement: undefined}
    ]);
  });

  it('should match directive on class', function() {
    expect(selector(e('<div class="a b c"></div>'))).toEqual([
      {selector: '.b', value: 'b', element: element, childNodes: element.childNodes, name: 'class'}
    ]);
  });


  it('should match directive on [attribute]', function() {
    expect(selector(e('<div directive=abc></div>'))).toEqual([
      {selector: '[directive]', value: 'abc', element: element, childNodes: element.childNodes, name: 'directive'}
    ]);
  });


  it('should match directive on element[attribute]', function() {
    expect(selector(e('<b directive=abc></b>'))).toEqual([
      {selector: 'b', value: undefined, element: element, childNodes: element.childNodes, name: undefined},
      {selector: 'b[directive]', value: 'abc', element: element, childNodes: element.childNodes, name: 'directive'},
      {selector: '[directive]', value: 'abc', element: element, childNodes: element.childNodes, name: 'directive'}
    ]);
  });


  it('should match directive on [attribute=value]', function() {
    expect(selector(e('<div directive=value></div>'))).toEqual([
      {selector: '[directive]', value: 'value', element: element, childNodes: element.childNodes, name: 'directive'},
      {selector: '[directive=value]', value: 'value', element: element, childNodes: element.childNodes, name: 'directive'}
    ]);
  });


  it('should match directive on element[attribute=value]', function() {
    expect(selector(e('<b directive=value></div>'))).toEqual([
      {selector: 'b', value: undefined, element: element, childNodes: element.childNodes, name: undefined},
      {selector: 'b[directive]', value: 'value', element: element, childNodes: element.childNodes, name: 'directive'},
      {selector: 'b[directive=value]', value: 'value', element: element, childNodes: element.childNodes, name: 'directive'},
      {selector: '[directive]', value: 'value', element: element, childNodes: element.childNodes, name: 'directive'},
      {selector: '[directive=value]', value: 'value', element: element, childNodes: element.childNodes, name: 'directive'}
    ]);
  });

  it('should match attributes', function() {
    expect(selector(e('<div attr="before-xyz-after"></div>'))).toEqual([
      {selector: '[*=/xyz/]', value: 'attr=before-xyz-after', element: element, childNodes: element.childNodes, name: 'attr', pseudoElement : undefined}
    ]);
  });

  it('should match text', function() {
    expect(selector(e('before-abc-after'))).toEqual([
      {selector: ':contains(/abc/)', value: 'before-abc-after', element: element, childNodes: element.childNodes, name: '#text'}
    ]);
  });

  it('should match comment', function() {
    expect(selector(e('<!--[directive=value]-->text<!--[/directive]-->'))).toEqual([
      {selector: '[directive]', value: 'value', element: element, childNodes:[ element.nextSibling ], name: 'directive', pseudoElement:true},
      {selector: '[directive=value]', value: 'value', element: element, childNodes:[ element.nextSibling ], name: 'directive', pseudoElement:true}
    ]);
  });

  describe('errors', function() {
    it('should fail on missing closing pseudo element', function() {
      expect(function() {
        selector(e('<!--[directive=value]-->text'));
      }).toThrow('Missing ending comment: [/directive]');
    });

    it('should fail on unparsable selector', function() {
      expect(function() {
        angular.core.Selector(['&']);
      }).toThrow('Unsupported Selector: &');

      expect(function() {
        angular.core.Selector(['name.class[attr=value]']);
      }).toThrow('Unsupported Selector: name.class[attr=value]');
    });

    it('should fail on unparsable selector', function() {
      expect(function() {
        angular.core.Selector(['something'], '>');
      }).toThrow('Selector must start with: > was: something');
    });
  });
});
