'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _streamtest = require('streamtest');

var _streamtest2 = _interopRequireDefault(_streamtest);

describe('TimeWhook', function () {
  var TimeWhook = require('./time');

  describe('constructor()', function () {
    it('should work', function () {
      new TimeWhook();
    });
  });

  describe('init()', function () {
    it('should be implemented', function () {
      new TimeWhook().init();
    });
  });

  describe('pre()', function () {

    it('should set the contentType', function () {
      var $ = {
        'in': {},
        out: {}
      };
      var whook = new TimeWhook();
      whook.init();
      whook.pre($, function () {
        (0, _neatequal2['default'])($.out, {
          contentType: 'text/plain',
          statusCode: 200
        });
      });
    });
  });

  describe('process()', function () {

    _streamtest2['default'].versions.forEach(function (version) {
      describe('for ' + version + ' streams', function () {

        it('should return a stream outputting the current time', function (done) {
          var $ = {
            'in': {},
            out: {},
            services: {
              time: function time() {
                return 13371337;
              },
              log: function log() {
                args = [].slice.call(arguments, 0);
              }
            }
          };
          var whook = new TimeWhook();
          var req = new whook.init();
          whook.process($, _streamtest2['default'][version].fromChunks([])).pipe(_streamtest2['default'][version].toText(function (err, text) {
            if (err) {
              done(err);
            }
            _assert2['default'].equal(text, '13371337');
            (0, _neatequal2['default'])($.out, {
              contentLength: text.length
            });
            done();
          }));
        });

        it.only('should log when a log service is available', function (done) {
          var args;
          var $ = {
            'in': {
              format: 'iso'
            },
            out: {},
            services: {
              time: function time() {
                return 13371337;
              },
              log: function log() {
                args = [].slice.call(arguments, 0);
              }
            }
          };
          var whook = new TimeWhook();
          whook.init();
          whook.process($, _streamtest2['default'][version].fromChunks([])).pipe(_streamtest2['default'][version].toText(function (err, text) {
            if (err) {
              done(err);
            }
            _assert2['default'].equal(text, '1970-01-01T03:42:51.337Z');
            (0, _neatequal2['default'])($.out, {
              contentLength: text.length
            });
            done();
          }));
        });
      });
    });
  });
});