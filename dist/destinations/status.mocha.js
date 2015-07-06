'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

describe('StatusDestination', function () {
  var StatusDestination = require('./status');

  describe('constructor()', function () {
    it('should work', function () {
      new StatusDestination();
    });
  });

  describe('set()', function () {

    it('should work', function () {
      new StatusDestination().set('', 200);
    });
  });

  describe('finish()', function () {

    it('should set status code to the response', function () {
      var res = {
        statusCode: 500
      };
      var headersSet = {};

      var hService = new StatusDestination(res);
      hService.set('', 200);
      hService.finish();

      (0, _neatequal2['default'])(res, {
        statusCode: 200
      });
    });
  });
});