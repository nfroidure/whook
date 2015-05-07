require("babel/register");

var assert = require('assert');
var neatequal = require('neatequal');
var sinon = require('sinon');

describe('HeadersDestination', function() {
  var HeadersDestination = require('./headers');

  describe('constructor()', function() {
    it('should work', function() {
      new HeadersDestination();
    });
  });

  describe('set()', function() {

    it('should work', function() {
      new HeadersDestination()
        .set('Content-Type', 'text/plain');

    });
  });

  describe('finish()', function() {

    it('should set headers to the response', function() {
      var res = {
        setHeader: function(key, value) {
          headersSet[key] = value;
        }
      };
      var headersSet = {};
      var stub = sinon.stub(res, 'setHeader');

      var hService = new HeadersDestination();
      hService.set('Content-Type', 'text/plain')
      hService.set('Content-Length', 15)
      hService.finish(res);

      neatequal(res, {
        'Content-Type': 'text/plain',
        'Content-Length': 15
      });

      assert.equal(stub.callCount, 2);

    });

  });

});