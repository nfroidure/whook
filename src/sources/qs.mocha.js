import assert from 'assert';

describe('QSSource', () => {
  let QSSource = require('./qs');

  describe('constructor()', () => {
    it('should work', () => {
      new QSSource({
        url: '/download',
      });
    });
  });

  describe('query()', () => {

    it('should return empty array when there are no query params', () => {

      assert.deepEqual(new QSSource({
        url: '/download',
      }).get('foo.bar'), []);
    });

    it('should return empty array when there are no query params', () => {

      assert.deepEqual(new QSSource({
        url: '/download?foobar=Plop',
      }).get('foobar'), ['Plop']);
    });

    it('should return empty array when there are no query params', () => {

      assert.deepEqual(new QSSource({
        url: '/download?foobar=Plop&foobar=Plop2',
      }).get('foobar.#'), ['Plop', 'Plop2']);
    });

  });

});
