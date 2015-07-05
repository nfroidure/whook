import assert from 'assert';
import neatequal from 'neatequal';
import sinon from 'sinon';

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

      var hService = new HeadersDestination(res);
      hService.set('Content-Type', 'text/plain');
      hService.set('Content-Length', 15);
      hService.finish();

      neatequal(res, {
        'Content-Type': 'text/plain',
        'Content-Length': 15
      });

      assert.equal(stub.callCount, 2);

    });

  });

});
