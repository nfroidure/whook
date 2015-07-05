'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

describe('Source', function () {
  var Source = require('./source');

  describe('constructor()', function () {
    it('should set the source name', function () {
      var source = new Source({}, 'name');
      _assert2['default'].equal(source.name, 'name');
    });
  });

  describe('query()', function () {

    it('should throw an error', function () {
      var source = new Source({}, 'name');
      _assert2['default'].throws(source.set, 'E_NOT_IMPLEMENTED');
    });
  });
});