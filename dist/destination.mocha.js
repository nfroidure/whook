'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

describe('Destination', function () {
  var Destination = require('./destination');

  describe('constructor()', function () {
    it('should set the destination name', function () {
      var destination = new Destination({}, 'name');
      _assert2['default'].equal(destination.name, 'name');
    });
  });

  describe('query()', function () {

    it('should throw an error', function () {
      var destination = new Destination({}, 'name');
      _assert2['default'].throws(destination.get, 'E_NOT_IMPLEMENTED');
    });
  });
});