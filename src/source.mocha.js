import assert from 'assert';

describe('Source', () => {
  let Source = require('./source');

  describe('constructor()', () => {
    it('should set the source name', () => {
      let source = new Source({}, 'name');

      assert.equal(source.name, 'name');
    });
  });

  describe('query()', () => {

    it('should throw an error', () => {
      let source = new Source({}, 'name');

      assert.throws(() => {
        source.set();
      }, 'E_NOT_IMPLEMENTED');
    });

  });

});
