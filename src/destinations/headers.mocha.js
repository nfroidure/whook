import assert from 'assert';
import neatequal from 'neatequal';
import sinon from 'sinon';

describe('HeadersDestination', () => {
  let HeadersDestination = require('./headers');

  describe('constructor()', () => {
    it('should work', () => {
      new HeadersDestination();
    });
  });

  describe('set()', () => {

    it('should work', () => {
      new HeadersDestination()
        .set('Content-Type', 'text/plain');

    });
  });

  describe('finish()', () => {

    it('should set headers to the response', () => {
      let headersSet = {};
      let res = {
        setHeader: (key, value) => {
          headersSet[key] = value;
        },
      };
      let stub = sinon.stub(res, 'setHeader');

      let hService = new HeadersDestination(res);

      hService.set('Content-Type', 'text/plain');
      hService.set('Content-Length', 15);
      hService.finish();

      neatequal(res, {
        'Content-Type': 'text/plain',
        'Content-Length': 15,
      });

      assert.equal(stub.callCount, 2);

    });

  });

});
