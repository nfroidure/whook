'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

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
      var whook = new Whook('name');
      _assert2['default'].throws(whook.specs, 'E_NOT_IMPLEMENTED');
    });
  });
});