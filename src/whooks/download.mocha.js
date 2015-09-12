import neatequal from 'neatequal';

describe('DownloadWhook', () => {
  let DownloadWhook = require('./download');

  describe('constructor()', () => {
    it('should work', () => {
      new DownloadWhook();
    });
  });

  describe('init()', () => {
    it('should be implemented', () => {
      (new DownloadWhook()).init();
    });
  });

  describe('pre()', () => {
    it('should do nothing when download is false', () => {
      let $ = {
        in: {
          download: false,
        },
        out: {},
        services: {},
      };
      let whook = new DownloadWhook();

      whook.init();
      whook.pre($, () => {
        neatequal($.out, {});
      });
    });

    it('should set contentDisposition when download is true', () => {
      let $ = {
        in: {
          download: true,
        },
        out: {},
        services: {},
      };
      let whook = new DownloadWhook();

      whook.init();
      whook.pre($, () => {
        neatequal($.out, {
          contentDisposition: 'attachment',
        });
      });
    });

    it('should set contentDisposition when download is true and filename has a value', () => {
      let $ = {
        in: {
          download: true,
          filename: 'duke.jpg',
        },
        out: {},
        services: {},
      };
      let whook = new DownloadWhook();

      whook.init();
      whook.pre($, () => {
        neatequal($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"',
        });
      });
    });

    it('should log when a log service is available', () => {
      let args;
      let $ = {
        in: {
          download: true,
          filename: 'duke.jpg',
        },
        out: {},
        services: {
          log: (..._args) => {
            args = _args;
          },
        },
      };
      let whook = new DownloadWhook();

      whook.init();
      whook.pre($, () => {
        neatequal($.out, {
          contentDisposition: 'attachment; filename="duke.jpg"',
        });
        neatequal(args, [
          'download',
          'out.contentDisposition set to:',
          'attachment; filename="duke.jpg"',
        ]);
      });
    });

  });

});
