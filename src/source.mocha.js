import assert from 'assert';

describe('Source', () => {
  let Source = require('./source');

  describe('constructor()', () => {
    it('should set the source name', () => {
      let source = new Source({}, 'name');

      assert.equal(source.name, 'name');
    });
    it('should throw an error if a bad req is given', () => {
      assert.throws(() => {
        new Source('hey', 'name');
      }, /E_BAD_SOURCE_REQUEST/);
    });
    it('should throw an error if a bad name is given', () => {
      assert.throws(() => {
        new Source({}, {});
      }, /E_BAD_SOURCE_NAME/);
    });
  });

  describe('query()', () => {

    it('should throw an error', () => {
      let source = new Source({}, 'name');

      assert.throws(() => {
        source.get();
      }, /E_NOT_IMPLEMENTED/);
    });

  });

});
