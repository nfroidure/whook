import assert from 'assert';

describe('Destination', () => {
  let Destination = require('./destination');

  describe('constructor()', () => {
    it('should set the destination name', () => {
      let destination = new Destination({}, 'name');

      assert.equal(destination.name, 'name');
    });
    it('should throw an error if a bad res is given', () => {
      assert.throws(() => {
        new Destination('hey', 'name');
      }, /E_BAD_DESTINATION_RESPONSE/);
    });
    it('should throw an error if a bad name is given', () => {
      assert.throws(() => {
        new Destination({}, {});
      }, /E_BAD_DESTINATION_NAME/);
    });
  });

  describe('query()', () => {

    it('should throw an error', () => {
      let destination = new Destination({}, 'name');

      assert.throws(() => {
        destination.set();
      }, /E_NOT_IMPLEMENTED/);
    });

  });

});
