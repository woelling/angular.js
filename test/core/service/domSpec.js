'use strict';

describe('angular.core.dom', function() {
  describe('htmlToDOM', function() {
    function expectHtmlCorrect(html) {
      var parts = [];

      angular.forEach(angular.core.dom.htmlToDOM(html), function(node) {
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

  describe('select', function() {
    var select = angular.core.dom.select;

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
});
