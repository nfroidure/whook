'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

describe('DownloadWhook', function () {
  var DownloadWhook = require('./download');

  describe('constructor()', function () {
    it('should work', function () {
      new DownloadWhook();
    });
  });

  describe('init()', function () {
    it('should be implemented', function () {
      new DownloadWhook().init();
    });
  });

  describe('pre()', function () {
    it('should do nothing when download is false', function () {
      var $ = {
        'in': {
          download: false
        },
        out: {},
        services: {}
      };
      var whook = new DownloadWhook();

      whook.init();
      whook.pre($, function () {
        (0, _neatequal2['default'])($.out, {});
      });
    });

    it('should set contentDisposition when download is true', function () {
      var $ = {
        'in': {
          download: true
        },
        out: {},
        services: {}
      };
      var whook = new DownloadWhook();

      whook.init();
      whook.pre($, function () {
        (0, _neatequal2['default'])($.out, {
          contentDisposition: 'attachment'
        });
      });
    });

    it('should set contentDisposition when download is true and filename has a value', function () {
      var $ = {
        'in': {
          download: true,
          filename: 'duke.jpg'
        },
        out: {},
        services: {}
      };
      var whook = new DownloadWhook();

      whook.init();
      whook.pre($, function () {
        (0, _neatequal2['default'])($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"'
        });
      });
    });

    it('should log when a log service is available', function () {
      var args = undefined;
      var $ = {
        'in': {
          download: true,
          filename: 'duke.jpg'
        },
        out: {},
        services: {
          log: function log() {
            for (var _len = arguments.length, _args = Array(_len), _key = 0; _key < _len; _key++) {
              _args[_key] = arguments[_key];
            }

            args = _args;
          }
        }
      };
      var whook = new DownloadWhook();

      whook.init();
      whook.pre($, function () {
        (0, _neatequal2['default'])($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"'
        });
        (0, _neatequal2['default'])(args, ['download', 'out.contentDisposition set to:', 'attachment; filename="duke.jpg"']);
      });
    });
  });
});