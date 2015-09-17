'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

describe('Source', function () {
  var Source = require('./source');

  describe('constructor()', function () {
    it('should set the source name', function () {
      var source = new Source({}, 'name');

      _assert2['default'].equal(source.name, 'name');
    });
    it('should throw an error if a bad req is given', function () {
      _assert2['default'].throws(function () {
        new Source('hey', 'name');
      }, /E_BAD_SOURCE_REQUEST/);
    });
    it('should throw an error if a bad name is given', function () {
      _assert2['default'].throws(function () {
        new Source({}, {});
      }, /E_BAD_SOURCE_NAME/);
    });
  });

  describe('query()', function () {

    it('should throw an error', function () {
      var source = new Source({}, 'name');

      _assert2['default'].throws(function () {
        source.get();
      }, /E_NOT_IMPLEMENTED/);
    });
  });
});