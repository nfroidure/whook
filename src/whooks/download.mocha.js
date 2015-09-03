import assert from 'assert';
import neatequal from 'neatequal';

describe('DownloadWhook', function() {
  let DownloadWhook = require('./download');

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
      let $ = {
        in: {
          download: false
        },
        out: {},
        services: {}
      };
      let whook = new DownloadWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {});
      });
    });

    it('should set contentDisposition when download is true', function() {
      let $ = {
        in: {
          download: true
        },
        out: {},
        services: {}
      };
      let whook = new DownloadWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {
          contentDisposition: 'attachment'
        });
      });
    });

    it('should set contentDisposition when download is true and filename has a value', function() {
      let $ = {
        in: {
          download: true,
          filename: 'duke.jpg'
        },
        out: {},
        services: {}
      };
      let whook = new DownloadWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"'
        });
      });
    });

    it('should log when a log service is available', function() {
      let args;
      let $ = {
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
      let whook = new DownloadWhook();
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
