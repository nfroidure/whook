'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

describe('Destination', function () {
  var Destination = require('./destination');

  describe('constructor()', function () {
    it('should set the destination name', function () {
      var destination = new Destination({}, 'name');

      _assert2['default'].equal(destination.name, 'name');
    });
    it('should throw an error if a bad res is given', function () {
      _assert2['default'].throws(function () {
        new Destination('hey', 'name');
      }, /E_BAD_DESTINATION_RESPONSE/);
    });
    it('should throw an error if a bad name is given', function () {
      _assert2['default'].throws(function () {
        new Destination({}, {});
      }, /E_BAD_DESTINATION_NAME/);
    });
  });

  describe('query()', function () {

    it('should throw an error', function () {
      var destination = new Destination({}, 'name');

      _assert2['default'].throws(function () {
        destination.set();
      }, /E_NOT_IMPLEMENTED/);
    });
  });
});