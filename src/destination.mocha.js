import assert from 'assert';

describe('Destination', () => {
  let Destination = require('./destination');

  describe('constructor()', () => {
    it('should set the destination name', () => {
      let destination = new Destination({}, 'name');

      assert.equal(destination.name, 'name');
    });
  });

  describe('query()', () => {

    it('should throw an error', () => {
      let destination = new Destination({}, 'name');

      assert.throws(() => {
        destination.get();
      }, 'E_NOT_IMPLEMENTED');
    });

  });

});
