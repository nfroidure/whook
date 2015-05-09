import assert from 'assert';
import neatequal from 'neatequal';

describe('Router', function() {
  var Router = require('./router')['default'];
  var WHOOK_SYMBOL = require('./router')['WHOOK_SYMBOL'];


  describe('constructor()', function() {
    it('should work', function() {
      new Router();
    });
  });

  describe('add()', function() {

    it('should build a nice whook tree', function() {

      var router = new Router()
        .add({
          nodes: []
        }, {
          name: 'Whook #1'
        })
        .add({
          nodes: ['plop']
        }, {
          name: 'Whook #2'
        })
        .add({
          nodes: ['plop', 'test']
        }, {
          name: 'Whook #3'
        })
        .add({
          nodes: ['plop']
        }, {
          name: 'Whook #4'
        });


      assert.deepEqual(router.whooksTree, { plop: { test: {} } });
      assert.deepEqual(router.whooksTree[WHOOK_SYMBOL], [{
        spec: { nodes: [] },
        whook: { name: 'Whook #1' }
      }]);
      assert.deepEqual(router.whooksTree.plop[WHOOK_SYMBOL], [{
        spec: { nodes: ['plop'] },
        whook: { name: 'Whook #2' }
      }, {
        spec: { nodes: ['plop'] },
        whook: { name: 'Whook #4' }
      }]);
    });

  });

});