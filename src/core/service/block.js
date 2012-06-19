'use strict';

goog.require('angular.coreModule');
goog.require('angular.core.Block');

goog.provide('angular.core.$Block');

angular.core.Block.BLOCK_DYNAMIC_SERVICES_REGEX = /^(\$text|\$attr_|\$on_|\$prop_)(.*)$/;
angular.core.Block.BLOCK_DYNAMIC_SERVICES = {
  '$text': function(name, block, element) {
    return element.nodeType == 3 /* text node */
        ? function(value) { element.nodeValue = value; }
        : function(value) { element.innerText = value; };
  },

  '$attr_': function(name, block, element) {
    return function(value) {
      return arguments.length ? element.setAttribute(name, value) : element.getAttribute(name);
    }
  },

  '$on_': function(name, block, element) {
    // TODO: there needs to be a way to clean this up on block detach
    return function(callback) {
      if (name == 'remove') {
        block.onRemove = callback;
      } else if (name == 'insert') {
        block.onInsert = callback;
      } else {
        element.addEventListener(name, callback);
      }
    }
  },

  '$prop_': function(name, block, element) {
    return function(value) {
      return element[name];
    }
  }
};

angular.core.Block.emptyInjector = createInjector();

angular.coreModule.factory('$Block', ['$exceptionHandler', '$Anchor', '$directiveInjector',
  function($exceptionHandler,   $Anchor, $directiveInjector) {
    function Block(elements, directiveDefs, blocksForAnchors) {
      this.elements = elements;
      this.previous = this.next = null;

      ASSERT(this.elements.length);

      var blockDirectives = this.directives = [],
          block = this;

      for(var i = 0, ii = directiveDefs.length; i < ii; i++) {
        var elementDirectiveDefs = directiveDefs[i] || EMPTY_ARRAY,
            elementSelector = elementDirectiveDefs[0],
            element = angular.core.$template.select(elements, elementSelector)[0],
            anchor,
            templates,
            directiveMap = {},
            directiveList = [],
            directiveValues = {},
            locals = {
              '$block': block,
              '$element': element,
              '$value': undefined
            },
            elementInjector = angular.core.Block.emptyInjector.locals(locals, function (name, $injector) {
              ASSERT(name);
              ASSERT($injector);
              var match = name.match(angular.core.Block.BLOCK_DYNAMIC_SERVICES_REGEX),
                  factory = match && angular.core.Block.BLOCK_DYNAMIC_SERVICES[match[1]],
                  oldParameter;

              if (factory) {
                return locals[name] = factory(match[2], block, element);
              } else if (directiveMap.hasOwnProperty(name)) {
                oldParameter = locals['$value'];
                try {
                  locals['$value'] = directiveValues[name];
                  return locals[name] = $injector.instantiate(directiveMap[name]);
                } catch (e) {
                  $exceptionHandler(e);
                } finally {
                  locals['$value'] = oldParameter;
                }
              }
            });

        for(var j = 1, jj = elementDirectiveDefs.length; j < jj; j++) {
          try {
            var directiveDef = elementDirectiveDefs[j],
                directive = directiveDef[0],
                directiveValue = directiveDef[1],
                directiveTemplate = directiveDef[2],
                directiveName;

            if (typeof directive == 'string') {
              directiveName = directive;
              directive = $directiveInjector.get(directiveName);
            } else {
              directiveName = directive.$name || '__' + nextUid();
            }

            if (directiveTemplate != undefined) {
              locals.$anchor = anchor = new $Anchor([element], directiveTemplate);
              templates = blocksForAnchors && blocksForAnchors[i];
              templates && loadExistingBlocksIntoAnchor(anchor, element, templates);
            }

            directiveMap[directiveName] = directive;
            directiveList.push(directiveName);
            directiveValues[directiveName] = directiveValue;
          } catch(e) {
            $exceptionHandler(e);
          }
        }

        for(var k = 0, kk = directiveList.length; k < kk; k++) {
          blockDirectives.push(elementInjector.get(directiveList[k]));
        }
      }
    };

    function loadExistingBlocksIntoAnchor(anchor, element, blocksForAnchor) {
      var lastTemplate = null;

      for(var k = 0, kk = blocksForAnchor.length, cmd; k < kk; k++) {
        cmd = blocksForAnchor[k];
        switch(typeof cmd) {
          case 'function':
            lastTemplate = cmd;
            break;
          case 'number':
            while(cmd--) {
              anchor.addExisting(lastTemplate([element = element.nextSibling]));
            }
            break;
          case 'object':
            /* assume array */
            anchor.addExisting(lastTemplate([element = element.nextSibling], cmd));
            break;
        }
      }
    }

    Block.prototype = {
      attach: function(scope) {
        // Attach directives
        for(var directives = this.directives, i = 0, ii = directives.length; i < ii; i++) {
          try {
            directives[i].attach(scope);
          } catch(e) {
            $exceptionHandler(e);
          }
        }
      },


      detach: function(scope) {
        for(var directives = this.directives, i = 0, ii = directives.length, directive; i < ii; i++) {
          try {
            directive = directives[i];
            directive.detach && directive.detach(scope);
          } catch(e) {
            $exceptionHandler(e);
          }
        }
      },


      insertAfter: function(previousBlock) {
        ASSERT(previousBlock);
        // Update Link List.
        if (this.next = previousBlock.next) {
          this.next.previous = this;
        }
        (this.previous = previousBlock).next = this;

        // Update DOM
        var previousElements = previousBlock.elements,
            previousElement = previousElements[previousElements.length - 1],
            insertBeforeElement = previousElement.nextSibling,
            parentElement = previousElement.parentNode,
            elements = this.elements,
            preventDefault = false;

        function insertDomElements() {
          for(var i = 0, ii = elements.length; i < ii; i++) {
            parentElement.insertBefore(elements[i], insertBeforeElement);
          }
        }

        if (this.onInsert) {
          this.onInsert({
            preventDefault: function() {
              preventDefault = true;
              return insertDomElements;
            },
            element: elements[0]
          });
        }

        if (!preventDefault) {
          insertDomElements();
        }

        return this;
      },


      remove: function() {
        var preventDefault = false,
            elements = this.elements,
            parent = elements[0].parentNode;

        function removeDomElements() {
          for(var j = 0, jj = elements.length; j < jj; j++) {
            parent.removeChild(elements[j]);
          }
        }

        if (this.onRemove) {
          this.onRemove({
            preventDefault: function() {
              preventDefault = true;
              return removeDomElements;
            },
            element: elements[0]
          });
        }

        if (!preventDefault) {
          removeDomElements();
        }

        // Remove block from list
        if (this.previous && (this.previous.next = this.next)) {
          this.next.previous = this.previous;
        }
        this.next = this.previous = null;
      },


      moveAfter: function(previousBlock) {
        var previousElements = previousBlock.elements,
            previousElement = previousElements[previousElements.length - 1],
            insertBeforeElement = previousElement.nextSibling,
            parentElement = previousElement.parentNode,
            blockElements = this.elements;

        for(var i = 0, ii = blockElements.length; i < ii; i++) {
          parentElement.insertBefore(blockElements[i], insertBeforeElement);
        }

        // Remove block from list
        if (this.previous.next = this.next) {
          this.next.previous = this.previous;
        }
        // Add block to list
        if (this.next = previousBlock.next) {
          this.next.previous = this;
        }
        (this.previous = previousBlock).next = this;
      }
    };

    return Block;
  }]);
