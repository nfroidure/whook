import assert from 'assert';
import neatequal from 'neatequal';
import sinon from 'sinon';

describe('StatusDestination', function() {
  var StatusDestination = require('./status');

  describe('constructor()', function() {
    it('should work', function() {
      new StatusDestination();
    });
  });

  describe('set()', function() {

    it('should work', function() {
      new StatusDestination()
        .set('', 200);
    });

    it('should fail with a non-number statusCode', function() {
      assert.throws(function() {
        new StatusDestination()
          .set('', '200');
      });
    });

    it('should fail with a too low statusCode', function() {
      assert.throws(function() {
        new StatusDestination()
          .set('', 99);
      });
    });

    it('should fail with a too high statusCode', function() {
      assert.throws(function() {
        new StatusDestination()
          .set('', 700);
      });
    });

  });

  describe('finish()', function() {

    it('should set status code to the response', function() {
      var res = {
        statusCode: 500
      };
      var headersSet = {};

      var hService = new StatusDestination(res);
      hService.set('', 200);
      hService.finish();

      neatequal(res, {
        statusCode: 200
      });

    });

  });

});
