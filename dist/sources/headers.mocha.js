'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

describe('HeadersSource', function () {
  var HeadersSource = require('./headers');

  describe('constructor()', function () {
    it('should work', function () {
      new HeadersSource({});
    });
  });

  describe('get()', function () {

    it('should work', function () {
      _assert2['default'].deepEqual(new HeadersSource({
        headers: {
          'content-type': 'text/plain'
        }
      }).get('Content-Type'), ['text/plain']);
      _assert2['default'].deepEqual(new HeadersSource({
        headers: {
          'content-length': '1024'
        }
      }).get('Content-Length'), [1024]);
    });
  });
});