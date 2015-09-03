import assert from 'assert';
import neatequal from 'neatequal';
import StreamTest from 'streamtest';

describe('TimeWhook', function() {
  let TimeWhook = require('./time');

  describe('constructor()', function() {
    it('should work', function() {
      new TimeWhook();
    });
  });

  describe('init()', function() {
    it('should be implemented', function() {
      (new TimeWhook()).init();
    });
  });

  describe('pre()', function() {

    it('should set the contentType', function() {
      let $ = {
        in: {},
        out: {}
      };
      let whook = new TimeWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {
          contentType: 'text/plain',
          statusCode: 200
        });
      });
    });
  });

  describe('process()', function() {


    StreamTest.versions.forEach(function(version) {
      describe('for ' + version + ' streams', function() {

        it('should return a stream outputting the current time', function(done) {
          let $ = {
            in: {},
            out: {},
            services: {
              time: {
                now: function() {
                  return 13371337;
                }
              },
              log: function() {
                args = [].slice.call(arguments, 0);
              }
            }
          };
          let whook = new TimeWhook();
          whook.init();
          whook.process($, StreamTest[version].fromChunks([]))
            .pipe(StreamTest[version].toText(function(err, text) {
              if(err) {
                return done(err);
              }
              assert.equal(text, '13371337');
              neatequal($.out, {
                contentLength: text.length
              });
              done();
            }));
        });

        it('should log when a log service is available', function(done) {
          let args;
          let $ = {
            in: {
              format: 'iso'
            },
            out: {},
            services: {
              time: {
                now: function() {
                  return 13371337;
                }
              },
              log: function() {
                args = [].slice.call(arguments, 0);
              }
            }
          };
          let whook = new TimeWhook();
          whook.init();
          whook.process($, StreamTest[version].fromChunks([]))
            .pipe(StreamTest[version].toText(function(err, text) {
              if(err) {
                done(err);
              }
              assert.equal(text, '1970-01-01T03:42:51.337Z');
              neatequal($.out, {
                contentLength: text.length
              });
              done();
            }));
        });

      });

    });

  });

});
