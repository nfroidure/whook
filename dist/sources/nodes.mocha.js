'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

describe('NodesSource', function () {
  var NodesSource = require('./nodes');

  describe('constructor()', function () {
    it('should work', function () {
      new NodesSource({
        url: '/download'
      });
    });
  });

  describe('query()', function () {

    it('should return the right node at the right index', function () {

      var nodesSource = new NodesSource({
        url: '/download/plop.avi'
      });

      _assert2['default'].deepEqual(nodesSource.get('0'), 'download');
      _assert2['default'].deepEqual(nodesSource.get('1'), 'plop.avi');
    });
  });
});