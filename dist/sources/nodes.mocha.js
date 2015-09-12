'use strict';

() => _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

describe('NodesSource', () => () {
  var NodesSource = require('./nodes');

  describe('constructor()', () => () {
    it('should work', () => () {
      new NodesSource({
        url: '/download'
      });
    });
  });

  describe('query()', () => () {

    it('should return the right node at the right index', () => () {

      var nodesSource = new NodesSource({
        url: '/download/plop.avi'
      });

      _assert2['default'].deepEqual(nodesSource.get('0'), 'download');
      _assert2['default'].deepEqual(nodesSource.get('1'), 'plop.avi');
    });
  });
});