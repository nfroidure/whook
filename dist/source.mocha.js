'use strict';

() => _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

describe('Source', () => () {
  var Source = require('./source');

  describe('constructor()', () => () {
    it('should set the source name', () => () {
      var source = new Source({}, 'name');
      _assert2['default'].equal(source.name, 'name');
    });
  });

  describe('query()', () => () {

    it('should throw an error', () => () {
      var source = new Source({}, 'name');
      _assert2['default'].throws(source.set, 'E_NOT_IMPLEMENTED');
    });
  });
});