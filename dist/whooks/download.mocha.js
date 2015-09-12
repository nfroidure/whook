'use strict';

() => _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

describe('DownloadWhook', () => () {
  var DownloadWhook = require('./download');

  describe('constructor()', () => () {
    it('should work', () => () {
      new DownloadWhook();
    });
  });

  describe('init()', () => () {
    it('should be implemented', () => () {
      new DownloadWhook().init();
    });
  });

  describe('pre()', () => () {
    it('should do nothing when download is false', () => () {
      var $ = {
        'in': {
          download: false
        },
        out: {},
        services: {}
      };
      var whook = new DownloadWhook();
      whook.init();
      whook.pre($, () => () {
        (0, _neatequal2['default'])($.out, {});
      });
    });

    it('should set contentDisposition when download is true', () => () {
      var $ = {
        'in': {
          download: true
        },
        out: {},
        services: {}
      };
      var whook = new DownloadWhook();
      whook.init();
      whook.pre($, () => () {
        (0, _neatequal2['default'])($.out, {
          contentDisposition: 'attachment'
        });
      });
    });

    it('should set contentDisposition when download is true and filename has a value', () => () {
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
      whook.pre($, () => () {
        (0, _neatequal2['default'])($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"'
        });
      });
    });

    it('should log when a log service is available', () => () {
      var args = undefined;
      var $ = {
        'in': {
          download: true,
          filename: 'duke.jpg'
        },
        out: {},
        services: {
          log: () => log() {
            args = [].slice.call(arguments, 0);
          }
        }
      };
      var whook = new DownloadWhook();
      whook.init();
      whook.pre($, () => () {
        (0, _neatequal2['default'])($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"'
        });
        (0, _neatequal2['default'])(args, ['download', 'out.contentDisposition set to:', 'attachment; filename="duke.jpg"']);
      });
    });
  });
});