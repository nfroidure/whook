'use strict';

require('babel/register');

var assert = require('assert');
var neatequal = require('neatequal');

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

      assert.deepEqual(new QSSource({
        url: '/download'
      }).get('foo.bar'), []);
    });

    it('should return empty array when there are no query params', function () {

      assert.deepEqual(new QSSource({
        url: '/download?foobar=Plop'
      }).get('foobar'), ['Plop']);
    });

    it('should return empty array when there are no query params', function () {

      assert.deepEqual(new QSSource({
        url: '/download?foobar=Plop&foobar=Plop2'
      }).get('foobar.#'), ['Plop', 'Plop2']);
    });
  });
});