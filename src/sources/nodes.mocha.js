import assert from 'assert';
import neatequal from 'neatequal';

describe('NodesSource', function() {
  let NodesSource = require('./nodes');

  describe('constructor()', function() {
    it('should work', function() {
      new NodesSource({
        url: '/download'
      });
    });
  });

  describe('query()', function() {

    it('should return the right node at the right index', function() {

      let nodesSource = new NodesSource({
        url: '/download/plop.avi'
      });

      assert.deepEqual(nodesSource.get('0'), 'download');
      assert.deepEqual(nodesSource.get('1'), 'plop.avi');
    });

  });

});