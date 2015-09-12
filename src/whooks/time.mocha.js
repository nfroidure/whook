/* eslint max-nested-callbacks:[1] */

import assert from 'assert';
import neatequal from 'neatequal';
import StreamTest from 'streamtest';
import initTimeMock from 'sf-time-mock';

describe('TimeWhook', () => {
  let TimeWhook = require('./time');
  let timeStub = initTimeMock();

  beforeEach(() => {
    timeStub.setTime(1267833600000);
  });

  describe('constructor()', () => {
    it('should work', () => {
      new TimeWhook();
    });
  });

  describe('init()', () => {
    it('should be implemented', () => {
      (new TimeWhook()).init();
    });
  });

  describe('pre()', () => {

    it('should set the contentType', () => {
      let $ = {
        in: {},
        out: {},
      };
      let whook = new TimeWhook();

      whook.init();
      whook.pre($, () => {
        neatequal($.out, {
          contentType: 'text/plain',
          statusCode: 200,
        });
      });
    });
  });

  describe('process()', () => {


    StreamTest.versions.forEach((version) => {
      describe('for ' + version + ' streams', () => {

        it('should return a stream outputting the current time', (done) => {
          let $ = {
            in: {},
            out: {},
            services: {
              time: {
                now: timeStub,
              },
            },
          };
          let whook = new TimeWhook();

          whook.init();
          whook.process($, StreamTest[version].fromChunks([]))
            .pipe(StreamTest[version].toText((err, text) => {
              if(err) {
                return done(err);
              }
              assert.equal(text, '1267833600000');
              neatequal($.out, {
                contentLength: text.length,
              });
              done();
            }));
        });

        it('should log when a log service is available', (done) => {
          let $ = {
            in: {
              format: 'iso',
            },
            out: {},
            services: {
              time: {
                now: timeStub,
              },
            },
          };
          let whook = new TimeWhook();

          whook.init();
          whook.process($, StreamTest[version].fromChunks([]))
            .pipe(StreamTest[version].toText((err, text) => {
              if(err) {
                return done(err);
              }
              assert.equal(text, '2010-03-06T00:00:00.000Z');
              neatequal($.out, {
                contentLength: text.length,
              });
              done();
            }));
        });

      });

    });

  });

});
