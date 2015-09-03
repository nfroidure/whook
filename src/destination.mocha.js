import assert from 'assert';
import neatequal from 'neatequal';
import sinon from 'sinon';

describe('Destination', function() {
  let Destination = require('./destination');

  describe('constructor()', function() {
    it('should set the destination name', function() {
      let destination = new Destination({}, 'name');

      assert.equal(destination.name, 'name');
    });
  });

  describe('query()', function() {

    it('should throw an error', function() {
      let destination = new Destination({}, 'name');

      assert.throws(destination.get, 'E_NOT_IMPLEMENTED');
    });

  });

});
