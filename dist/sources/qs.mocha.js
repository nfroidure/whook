'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

describe('QSSource', function () {
  var QSSource = require('./qs');

  describe('constructor()', function () {
    it('should work', function () {
      new QSSource({
        url: '/download'
      });
    });
  });

  describe('query()', function () {

    it('should return empty array when there are no query params', function () {

      _assert2['default'].deepEqual(new QSSource({
        url: '/download'
      }).get('foo.bar'), []);
    });

    it('should return empty array when there are no query params', function () {

      _assert2['default'].deepEqual(new QSSource({
        url: '/download?foobar=Plop'
      }).get('foobar'), ['Plop']);
    });

    it('should return empty array when there are no query params', function () {

      _assert2['default'].deepEqual(new QSSource({
        url: '/download?foobar=Plop&foobar=Plop2'
      }).get('foobar.#'), ['Plop', 'Plop2']);
    });
  });
});