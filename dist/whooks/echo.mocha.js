/* eslint max-nested-callbacks:[1] */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _streamtest = require('streamtest');

var _streamtest2 = _interopRequireDefault(_streamtest);

var _sfTimeMock = require('sf-time-mock');

var _sfTimeMock2 = _interopRequireDefault(_sfTimeMock);

describe('TimeWhook', function () {
  var TimeWhook = require('./time');
  var timeStub = (0, _sfTimeMock2['default'])();

  beforeEach(function () {
    timeStub.setTime(1267833600000);
  });

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
              time: {
                now: timeStub
              }
            }
          };
          var whook = new TimeWhook();

          whook.init();
          whook.process($, _streamtest2['default'][version].fromChunks([])).pipe(_streamtest2['default'][version].toText(function (err, text) {
            if (err) {
              return done(err);
            }
            _assert2['default'].equal(text, '1267833600000');
            (0, _neatequal2['default'])($.out, {
              contentLength: text.length
            });
            done();
          }));
        });

        it('should log when a log service is available', function (done) {
          var $ = {
            'in': {
              format: 'iso'
            },
            out: {},
            services: {
              time: {
                now: timeStub
              }
            }
          };
          var whook = new TimeWhook();

          whook.init();
          whook.process($, _streamtest2['default'][version].fromChunks([])).pipe(_streamtest2['default'][version].toText(function (err, text) {
            if (err) {
              return done(err);
            }
            _assert2['default'].equal(text, '2010-03-06T00:00:00.000Z');
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