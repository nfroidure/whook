/* eslint max-nested-callbacks:[1] */

import assert from 'assert';
import neatequal from 'neatequal';
import StreamTest from 'streamtest';
import Stream from 'stream';

describe('TimeWhook', () => {
  let EchoWhook = require('./echo');

  describe('constructor()', () => {
    it('should work', () => {
      new EchoWhook();
    });
  });

  describe('init()', () => {
    it('should be implemented', () => {
      (new EchoWhook()).init(EchoWhook.specs());
    });
  });

  describe('pre()', () => {

    it('should set the contentType', () => {
      let $ = {
        in: {
          contentType: 'text/plain',
          contentLength: 10,
        },
        out: {},
        services: {
          temp: {
            set: () => { },
          },
        },
      };
      let whook = new EchoWhook();

      whook.init(EchoWhook.specs());
      whook.ackInput($, {}, () => {
        neatequal($.out, {
          contentType: 'text/plain',
          contentLength: 10,
          statusCode: 200,
        });
      });
    });
  });

  describe('processOutput()', () => {


    StreamTest.versions.forEach((version) => {
      describe('for ' + version + ' streams', () => {

        it('should return a stream outputting the current time', (done) => {
          let statusCode = 201;
          let $ = {
            in: {},
            out: {
              statusCode: statusCode,
            },
            services: {
              temp: {
                get: (key) => {
                  if('content' !== key) {
                    throw new Error('E_BAD_KEY');
                  }
                  return StreamTest[version].fromChunks(['a', 'b', 'c']);
                },
              },
            },
          };
          let whook = new EchoWhook();
          let outStream = new Stream.PassThrough();

          whook.init(EchoWhook.specs({
            statusCode: statusCode,
          }));
          assert(!whook.processOutput($, outStream, () => {}));
          outStream.pipe(StreamTest[version].toText((err, text) => {
            if(err) {
              return done(err);
            }
            assert.equal(text, 'abc');
            done();
          }));
        });

      });

    });

  });

});
