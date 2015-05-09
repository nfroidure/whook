import assert from 'assert';
import neatequal from 'neatequal';

describe('Source', function() {
  var Source = require('./source');

  describe('constructor()', function() {
    it('should set the source name', function() {
      var source = new Source('name');
      assert.equal(source.name, 'name');
    });
  });

  describe('query()', function() {

    it('should throw an error', function() {
      var source = new Source('name');
      assert.throws(source.set, 'E_NOT_IMPLEMENTED');
    });

  });

});