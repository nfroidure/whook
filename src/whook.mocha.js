import assert from 'assert';
import neatequal from 'neatequal';

describe('Whook', function() {
  let Whook = require('./whook');

  describe('constructor()', function() {
    it('should set the whook name', function() {
      let whook = new Whook('name');
      assert.equal(whook.name, 'name');
    });
  });

  describe('specs()', function() {

    it('should throw an error', function() {
      let whook = new Whook('name');
      assert.throws(whook.specs, 'E_NOT_IMPLEMENTED');
    });

  });

});
