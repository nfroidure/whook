var assert = require('assert');
var neatequal = require('neatequal');

describe('DownloadWhook', function() {
  var DownloadWhook = require('./../../dist/whooks/download');

  describe('constructor()', function() {
    it('should work', function() {
      new DownloadWhook();
    });
  });

  describe('init()', function() {
    it('should be implemented', function() {
      (new DownloadWhook()).init();
    });
  });

  describe('pre()', function() {
    it('should do nothing when download is false', function() {
      var $ = {
        in: {
          download: false
        },
        out: {}
      };
      var whook = new DownloadWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {});
      });
    });

    it('should set contentDisposition when download is true', function() {
      var $ = {
        in: {
          download: true
        },
        out: {}
      };
      var whook = new DownloadWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {
          contentDisposition: 'attachment'
        });
      });
    });

    it('should set contentDisposition when download is true and filename has a value', function() {
      var $ = {
        in: {
          download: true,
          filename: 'duke.jpg'
        },
        out: {}
      };
      var whook = new DownloadWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"'
        });
      });
    });

    it('should log when a log service is available', function() {
      var args;
      var $ = {
        in: {
          download: true,
          filename: 'duke.jpg'
        },
        out: {},
        services: {
          log: function() {
            args = [].slice.call(arguments, 0);
          }
        }
      };
      var whook = new DownloadWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"'
        });
        neatequal(args, [
          'download',
          'out.contentDisposition set to:',
          'attachment; filename="duke.jpg"'
        ]);
      });
    });

  });

});