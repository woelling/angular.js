'use strict';

angular.module('core.test', ['core']).config(function($provide) {
  $provide.value('$rootElement', $('<div ng-app></div>'));
});

describe('core.test', function() {
  var select = angular.core.$template.select;

  beforeEach(module('core.test'));

  var $rootScope, $rootElement, $template;

  beforeEach(inject(function(_$template_, _$rootElement_, _$rootScope_) {
    $template = _$template_;
    $rootElement = _$rootElement_;
    $rootScope = _$rootScope_;
  }));

  describe('template', function() {
    beforeEach(inject());


    it('should create a simple template', function() {
      $rootElement.html('<div></div>');

      var template = $template('.', [
        ['.', ['[bind]', 'name']]
      ]);

      var block = template('.');

      block.attach($rootScope);

      $rootScope.name = 'misko';
      $rootScope.$apply();

      expect($rootElement.text()).toEqual('misko');
    });


    it('should create a nested template', function() {
      $rootElement.html('<ul class="ul"><!----></ul>');
      var li = $template('<li></li>', [
        ['.', ['[bind]', 'name']]
      ]);
      var ul = $template('.', [
        ['.ul>0', ['[repeat]', 'name in names', li]]
      ]);

      var block = ul('.');
      block.attach($rootScope);

      $rootScope.names = ['misko', 'igor'];
      $rootScope.$apply();

      expect($rootElement.html()).toEqual('<ul class="ul"><!----><li>misko</li><li>igor</li></ul>');
    });


    it('should create a nested template, but reuse block instances', function() {
      $rootElement.html('<ul class="ul"> <li class="a"></li><li class="b"></li></ul>');
      var li = $template('.ul>1', [
        ['.', ['[bind]', 'name']]
      ]);
      var ul = $template('.', [
        ['.ul>0', ['[repeat]', 'name in names', li]]
      ]);

      var block = ul('.', [
        [li, 2]
      ]);
      block.attach($rootScope);

      $rootScope.names = ['misko', 'igor'];
      $rootScope.$apply();

      expect($rootElement.html()).
          toEqual('<ul class="ul"> <li class="a">misko</li><li class="b">igor</li></ul>');
    });


    it('should create a nested template, reuse block instances, discard the rest', function() {
      $rootElement.html('<ul class="ul"> <li class="a"></li><li class="b"></li><li>extra</li></ul>');
      var li = $template('.ul>1', [
        ['.', ['[bind]', 'name']]
      ]);
      var ul = $template('.', [
        ['.ul>0', ['[repeat]', 'name in names', li]]
      ]);

      var block = ul('.', [
        [li, 3]
      ]);
      block.attach($rootScope);

      $rootScope.names = ['misko', 'igor'];
      $rootScope.$apply();

      expect($rootElement.html()).
          toEqual('<ul class="ul"> <li class="a">misko</li><li class="b">igor</li></ul>');
    });


    it('should create a nested template', function() {
      $rootElement.html('<ul class="ul"><!----></ul>');
      var div = $template('<div></div>', [
        ['.', ['[bind]', 'col']]
      ]);
      var li = $template('<li><!----></li>', [
        ['.>0', ['[repeat]', 'col in cols', div]]
      ]);
      var ul = $template('.', [
          ['.ul>0', ['[repeat]', 'cols in rows', li]]
      ]);

      var block = ul('.');
      block.attach($rootScope);

      $rootScope.rows = [['r0c0', 'r0c1'], ['r1c0', 'r1c1']];
      $rootScope.$apply();

      expect($rootElement.html()).toEqual(
          '<ul class="ul">' +
            '<!---->' +
            '<li>' +
              '<!----><div>r0c0</div><div>r0c1</div>' +
            '</li>' +
            '<li>' +
              '<!----><div>r1c0</div><div>r1c1</div>' +
            '</li>' +
          '</ul>');
    });


    it('should create a nested template but reuse block instances', function() {
      $rootElement.html(
          '<ul class="ul">' +
            '<!---->' +
            '<li class="li">' +
              '<!----><div>A</div><div>B</div>' +
            '</li>' +
            '<li><!----></li>' +
          '</ul>');
      var div = $template('.li>1', [
        ['.', ['[bind]', 'col']]
      ]);
      var li = $template('.li', [
        ['.>0+2', ['[repeat]', 'col in cols', div]]
      ]);
      var ul = $template('.', [
        ['.ul>0+2', ['[repeat]', 'cols in rows', li]]
      ]);

      var block = ul('.', [
        [li, [[div, 2]], 1]
      ]);
      block.attach($rootScope);

      $rootScope.rows = [['r0c0', 'r0c1'], ['r1c0', 'r1c1']];
      $rootScope.$apply();

      expect($rootElement.html()).toEqual(
          '<ul class="ul">' +
            '<!---->' +
            '<li class="li">' +
              '<!----><div>r0c0</div><div>r0c1</div>' +
            '</li>' +
            '<li>' +
              '<!----><div>r1c0</div><div>r1c1</div>' +
            '</li>' +
          '</ul>');
    });
  });


  describe('selectors', function() {
    beforeEach(function() {
      this.addMatchers({
        toEqualDOM: function(expected) {
          function toHtml(elements) {
            if (elements) {
              var parts = [];
              for(var i = 0, ii = elements.length; i < ii ; i++) {
                parts.push(angular.mock.dump(elements[i]));
              }

              return parts.join('');
            } else {
              return '';
            }
          }

          this.message = function() {
            return "Expected: " + expected + ' but was: ' + toHtml(this.actual);
          }

          return toHtml(this.actual) == expected;
        }
      });
    });


    it('should select current element', function() {
      var dom = $('<div></div><span></span>');

      expect(select(dom, '.')).toEqualDOM('<div></div>');
    });


    it('should select child element', function() {
      var dom = $('<div><span>a</span><span>b</span></div>');

      expect(select(dom, '.>1')).toEqualDOM('<span>b</span>');
    });

    it('should select child elements', function() {
      var dom = $('<div>a<span>b</span><span>c</span>d</div>');

      expect(select(dom, '.>1+1')).toEqualDOM('<span>b</span><span>c</span>');
    });

    it('should select elements by offset', function() {
      var dom = $('<b></b><div></div><span></span><ul></ul>');
      dom = [dom[0], dom[1], dom[2], dom[3]]; // jQuery is not really an array.

      expect(select(dom, '1+1')).toEqualDOM('<div></div><span></span>');
      expect(select(dom, '1')).toEqualDOM('<div></div>');
      expect(function() {
        select(dom, '4');
      }).toThrow('Selector offset too big.');
    });

  });


  describe('directive injection', function() {
    it('should inject other directive', function(){
      var injectedB, b;

      function A(b) {
        injectedB = b;
      }
      A.$name = 'a';

      function B() {
        b = this;
      }
      B.$name = 'b';

      $template('<div></div>', [
        ['.',  [A, null], [B, null]]
      ])();

      expect(b instanceof B).toBe(true);
      expect(injectedB).toBe(b);
    });
  });


  describe('htmlToDOM', function() {
    function expectHtmlCorrect(html) {
      var parts = [];

      angular.forEach(angular.core.$template.htmlToDOM(html), function(node) {
        parts.push(angular.mock.dump(node));
      });

      expect(parts.join('')).toEqual(html);
    }

    it('should correctly parse html', function() {
      expectHtmlCorrect('hello');
      expectHtmlCorrect('<!--comment-->');
      expectHtmlCorrect('<style></style>');
      expectHtmlCorrect('<span>abc</span>hello');
      expectHtmlCorrect('<legend>abc</legend>');
      expectHtmlCorrect('<thead></thead>');
      expectHtmlCorrect('<tbody></tbody>');
      expectHtmlCorrect('<tfoot></tfoot>');
      expectHtmlCorrect('<tr></tr>');
      expectHtmlCorrect('<td></td>');
      expectHtmlCorrect('<th></th>');
      expectHtmlCorrect('<col>');
      expectHtmlCorrect('<area>');
      expectHtmlCorrect('<colgroup></colgroup>');

      expectHtmlCorrect('<td>abc</td>');
      expectHtmlCorrect('<!----><td>abc</td>');
      expectHtmlCorrect('<tr><td>abc</td></tr>');
      expectHtmlCorrect('<th>abc</th>');
      expectHtmlCorrect('<tbody><tr><td>abc</td></tr></tbody>');
      expectHtmlCorrect('<option>abc</option><option>xyz</option>');
      expectHtmlCorrect('<title>abc</title>');
    });
  });
});
