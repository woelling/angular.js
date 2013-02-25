'use strict';

describe('angular.core.dom', function() {
  describe('angular.core.dom.NodeCursor', function() {
    var a, b, c, d;

    beforeEach(function() {
      a = $('<a>A</a>')[0];
      b = $('<b>B</b>')[0];
      c = $('<i>C</i>')[0];
      d = $('<span></span>')[0];
      $(d).append(a).append(b);
    });


    it('should allow single level traversal', function() {
      var cursor = new angular.core.dom.NodeCursor([a, b]);

      expect(cursor.nodeList()).toEqual([a]);
      expect(cursor.microNext()).toEqual(true);
      expect(cursor.nodeList()).toEqual([b]);
      expect(cursor.microNext()).toEqual(false);
    });


    it('should descend and ascend', function() {
      var cursor = new angular.core.dom.NodeCursor([d, c]);

      expect(cursor.descend()).toEqual(true);
      expect(cursor.nodeList()).toEqual([a]);
      expect(cursor.microNext()).toEqual(true);
      expect(cursor.nodeList()).toEqual([b]);
      expect(cursor.microNext()).toEqual(false);
      cursor.ascend();
      expect(cursor.microNext()).toEqual(true);
      expect(cursor.nodeList()).toEqual([c]);
      expect(cursor.microNext()).toEqual(false);
    });


    it('should create child cursor upon replace of top level', function() {
      var parentCursor = new angular.core.dom.NodeCursor([a]);
      var childCursor = parentCursor.replaceWithAnchor('child');

      expect(parentCursor.elements.length).toEqual(1);
      expect(STRINGIFY(parentCursor.elements[0])).toEqual('<!--ANCHOR: child-->');
      expect(childCursor.elements).toEqual([a]);

      var leafCursor = childCursor.replaceWithAnchor('leaf');

      expect(childCursor.elements.length).toEqual(1);
      expect(STRINGIFY(childCursor.elements[0])).toEqual('<!--ANCHOR: leaf-->');
      expect(leafCursor.elements).toEqual([a]);
    });


    it('should create child cursor upon replace of mid level', function() {
      var dom = $('<div><span>text</span></div>')
      var parentCursor = new angular.core.dom.NodeCursor(dom);
      parentCursor.descend(); // <span>

      var childCursor = parentCursor.replaceWithAnchor('child');
      expect(dom.html()).toEqual('<!--ANCHOR: child-->');

      expect(STRINGIFY(childCursor.elements[0])).toEqual('<span>text</span>');
    });

    describe('include-next', function() {
      it('should select multiple items', function() {
        var dom = $('<span include-next>a</span><span>b</span>')
        var cursor = new angular.core.dom.NodeCursor(dom);

        expect(cursor.nodeList()).toEqual([dom[0], dom[1]]);
      });
    });
  });

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
