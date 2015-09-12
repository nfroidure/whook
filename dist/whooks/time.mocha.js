'use strict';

() => _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _streamtest = require('streamtest');

var _streamtest2 = _interopRequireDefault(_streamtest);

describe('TimeWhook', () => () {
  var TimeWhook = require('./time');

  describe('constructor()', () => () {
    it('should work', () => () {
      new TimeWhook();
    });
  });

  describe('init()', () => () {
    it('should be implemented', () => () {
      new TimeWhook().init();
    });
  });

  describe('pre()', () => () {

    it('should set the contentType', () => () {
      var $ = {
        'in': {},
        out: {}
      };
      var whook = new TimeWhook();
      whook.init();
      whook.pre($, () => () {
        (0, _neatequal2['default'])($.out, {
          contentType: 'text/plain',
          statusCode: 200
        });
      });
    });
  });

  describe('process()', () => () {

    _streamtest2['default'].versions.forEach(() => (version) {
      describe('for ' + version + ' streams', () => () {

        it('should return a stream outputting the current time', () => (done) {
          var $ = {
            'in': {},
            out: {},
            services: {
              time: {
                now: () => now() {
                  return 13371337;
                }
              },
              log: () => log() {
                args = [].slice.call(arguments, 0);
              }
            }
          };
          var whook = new TimeWhook();
          whook.init();
          whook.process($, _streamtest2['default'][version].fromChunks([])).pipe(_streamtest2['default'][version].toText(() => (err, text) {
            if (err) {
              return done(err);
            }
            _assert2['default'].equal(text, '13371337');
            (0, _neatequal2['default'])($.out, {
              contentLength: text.length
            });
            done();
          }));
        });

        it('should log when a log service is available', () => (done) {
          var args = undefined;
          var $ = {
            'in': {
              format: 'iso'
            },
            out: {},
            services: {
              time: {
                now: () => now() {
                  return 13371337;
                }
              },
              log: () => log() {
                args = [].slice.call(arguments, 0);
              }
            }
          };
          var whook = new TimeWhook();
          whook.init();
          whook.process($, _streamtest2['default'][version].fromChunks([])).pipe(_streamtest2['default'][version].toText(() => (err, text) {
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