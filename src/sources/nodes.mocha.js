import assert from 'assert';

describe('NodesSource', () => {
  let NodesSource = require('./nodes');

  describe('constructor()', () => {
    it('should work', () => {
      new NodesSource({
        url: '/download',
      });
    });
  });

  describe('query()', () => {

    it('should return the right node at the right index', () => {

      let nodesSource = new NodesSource({
        url: '/download/plop.avi',
      });

      assert.deepEqual(nodesSource.get('0'), 'download');
      assert.deepEqual(nodesSource.get('1'), 'plop.avi');
    });

  });

});
