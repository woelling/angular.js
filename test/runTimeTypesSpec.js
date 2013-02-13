'use strict';

describe('run time types', function() {

  describe('VERIFY', function() {
    it('should do nothing on empty function', function() {
      VERIFY(arguments);
    });


    it('should pass when argument present', function() {
      function fn(x){
        VERIFY(arguments,
            ARG('x').is(String));
      }

      fn('value'); // no exception
    });


    it('should throw when arg missing', function() {
      function fn(x){
        VERIFY(arguments,
            ARG('x').is(String));
      }

      expect(function() {
        fn(); // missing argument
      }).toThrow('Argument x at position 1 expecting string was undefined');
    });


    it('should verify that it is optional', function() {
      function fn(x){
        VERIFY(arguments,
            ARG('x').is(String, undefined));
      }

      fn('x'); // no exception
      fn(); // no exception
    });


    it('should verify struct', function() {
      expect(TYPE.verifyStruct({a:'', b:1}, {a:String, b:Number, c: UNION(Function, undefined)})).
          toEqual(true);
    });
  });


  describe('VAR', function() {
    it('should verify directly', function() {
      VAR('value'); // no exception

      expect(function() {
        VAR(null, 'name').is(String);
      }).toThrow("var 'name' expecting string was null");
    });
  });


  describe('assertions', function() {
    it('should check is', function() {
      VAR('', 'name').is(String);
      VAR(123, 'name').is(Number);
      VAR(function() {}, 'name').is(Function);
      VAR({}, 'name').is(Object);
      VAR(null, 'name').is(Object, null);
      VAR(undefined, 'name').is(Object, undefined);

      expect(function() {
        VAR(1, 'x').is(String);
      }).toThrow("var 'x' expecting string was number");
    });


    it('should check interfaces', function() {
      var MyType = TYPE('MyType', function(value) {
        return value.myType == true;
      });

      VAR({myType:true}).is(MyType);

      expect(function() {
        VAR({}).is(MyType);
      }).toThrow("expecting MyType was {}");
    });
  });


  describe('ARRAY', function() {
    it('should check arrays', function() {
      VAR([]).is(Array);
      VAR([]).is(ARRAY());
      VAR(['']).is(ARRAY(String));
      VAR(['', 1]).is(ARRAY(String, Number));

      expect(function() {
        VAR({}).is(ARRAY());
      }).toThrow('expecting Array.<*> was {}');

      expect(function() {
        VAR([12, true]).is(ARRAY(String));
      }).toThrow('expecting Array.<string> was Array.<boolean|number>');
    });
  });


  describe('OBJECT', function() {
    it('should check arrays', function() {
      VAR({}).is(Object);
      VAR({}).is(OBJECT());
      VAR({a:''}).is(OBJECT(String));
      VAR({a:'', b:1}).is(OBJECT(String, Number));

      expect(function() {
        VAR([]).is(OBJECT());
      }).toThrow('expecting Object.<*> was Array.<>');

      expect(function() {
        VAR({a:12}).is(OBJECT(String));
      }).toThrow('expecting Object.<string> was {a: number}');
    });
  });


  describe('function', function() {
    it('should chekc functions', function() {
      var fn = function(a, b) {};

      VAR(fn).is(Function);
      VAR(fn).is(FUNCTION(String, Array));

      expect(function() {
        VAR(fn).is(String);
      }).toThrow('expecting string was function(?, ?)');

    });
  });


  describe('TYPE.extract', function() {

  });
});
