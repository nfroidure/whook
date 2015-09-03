import assert from 'assert';
import neatequal from 'neatequal';

describe('Source', function() {
  let Source = require('./source');

  describe('constructor()', function() {
    it('should set the source name', function() {
      let source = new Source({}, 'name');
      assert.equal(source.name, 'name');
    });
  });

  describe('query()', function() {

    it('should throw an error', function() {
      let source = new Source({}, 'name');
      assert.throws(source.set, 'E_NOT_IMPLEMENTED');
    });

  });

});
