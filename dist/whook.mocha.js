'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

describe('Whook', function () {
  var Whook = require('./whook');

  describe('constructor()', function () {
    it('should set the whook name', function () {
      var whook = new Whook('name');

      _assert2['default'].equal(whook.name, 'name');
    });
  });

  describe('specs()', function () {

    it('should throw an error', function () {
      _assert2['default'].throws(function () {
        Whook.specs();
      }, /E_NOT_IMPLEMENTED/);
    });
  });
});