'use strict';

() => _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

describe('StatusDestination', () => () {
  var StatusDestination = require('./status');

  describe('constructor()', () => () {
    it('should work', () => () {
      new StatusDestination();
    });
  });

  describe('set()', () => () {

    it('should work', () => () {
      new StatusDestination().set('', 200);
    });

    it('should fail with a non-number statusCode', () => () {
      _assert2['default'].throws(() => () {
        new StatusDestination().set('', '200');
      });
    });

    it('should fail with a too low statusCode', () => () {
      _assert2['default'].throws(() => () {
        new StatusDestination().set('', 99);
      });
    });

    it('should fail with a too high statusCode', () => () {
      _assert2['default'].throws(() => () {
        new StatusDestination().set('', 700);
      });
    });
  });

  describe('finish()', () => () {

    it('should set status code to the response', () => () {
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