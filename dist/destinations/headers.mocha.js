'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

describe('HeadersDestination', function () {
  var HeadersDestination = require('./headers');

  describe('constructor()', function () {
    it('should work', function () {
      new HeadersDestination({});
    });
  });

  describe('set()', function () {

    it('should work', function () {
      new HeadersDestination({}).set('Content-Type', 'text/plain');
    });
  });

  describe('finish()', function () {

    it('should set headers to the response', function () {
      var headersSet = {};
      var res = {
        setHeader: function setHeader(key, value) {
          headersSet[key] = value;
        }
      };
      var stub = _sinon2['default'].stub(res, 'setHeader');

      var hService = new HeadersDestination(res);

      hService.set('Content-Type', 'text/plain');
      hService.set('Content-Length', 15);
      hService.finish();

      (0, _neatequal2['default'])(res, {
        'Content-Type': 'text/plain',
        'Content-Length': 15
      });

      _assert2['default'].equal(stub.callCount, 2);
    });
  });
});