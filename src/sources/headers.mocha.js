import assert from 'assert';
import neatequal from 'neatequal';
import sinon from 'sinon';

describe('HeadersSource', () => {
  let HeadersSource = require('./headers');

  describe('constructor()', () => {
    it('should work', () => {
      new HeadersSource({});
    });
  });

  describe('get()', () => {

    it('should work', () => {
      assert.deepEqual(new HeadersSource({
        headers: {
          'content-type': 'text/plain',
        },
      }).get('Content-Type', 'text/plain'),
      ['text/plain']);

    });
  });

});
