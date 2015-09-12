import assert from 'assert';

describe('Whook', () => {
  let Whook = require('./whook');

  describe('constructor()', () => {
    it('should set the whook name', () => {
      let whook = new Whook('name');

      assert.equal(whook.name, 'name');
    });
  });

  describe('specs()', () => {

    it('should throw an error', () => {
      let whook = new Whook('name');

      assert.throws(() => {
        whook.specs();
      }, 'E_NOT_IMPLEMENTED');
    });

  });

});
