import assert from 'assert';
import neatequal from 'neatequal';
import sinon from 'sinon';

describe('Destination', function() {
  var Destination = require('./destination');

  describe('constructor()', function() {
    it('should set the destination name', function() {
      var destination = new Destination({}, 'name');
      assert.equal(destination.name, 'name');
    });
  });

  describe('query()', function() {

    it('should throw an error', function() {
      var destination = new Destination({}, 'name');
      assert.throws(destination.get, 'E_NOT_IMPLEMENTED');
    });

  });

});
