import assert from 'assert';
import neatequal from 'neatequal';

describe('StatusDestination', () => {
  let StatusDestination = require('./status');

  describe('constructor()', () => {
    it('should work', () => {
      new StatusDestination({});
    });
  });

  describe('set()', () => {

    it('should work', () => {
      new StatusDestination({})
        .set('', 200);
    });

    it('should fail with a non-number statusCode', () => {
      assert.throws(() => {
        new StatusDestination()
          .set('', '200');
      });
    });

    it('should fail with a too low statusCode', () => {
      assert.throws(() => {
        new StatusDestination()
          .set('', 99);
      });
    });

    it('should fail with a too high statusCode', () => {
      assert.throws(() => {
        new StatusDestination()
          .set('', 700);
      });
    });

  });

  describe('finish()', () => {

    it('should set status code to the response', () => {
      let res = {
        statusCode: 500,
      };

      let hService = new StatusDestination(res);

      hService.set('', 200);
      hService.finish();

      neatequal(res, {
        statusCode: 200,
      });

    });

  });

});
