/* eslint max-nested-callbacks:[1] */

import assert from 'assert';
import neatequal from 'neatequal';
import StreamTest from 'streamtest';
import Stream from 'stream';
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

  describe('ackInput()', () => {

    it('should set the contentType/Length', () => {
      let $ = {
        in: {},
        out: {},
        services: {
          time: {
            now: timeStub,
          },
          temp: {
            set: () => { },
          },
        },
      };
      let whook = new TimeWhook();

      whook.init();
      whook.ackInput($, () => {
        neatequal($.out, {
          contentType: 'text/plain',
          contentLength: 13,
          statusCode: 200,
        });
      });
    });
  });

  describe('processOutput()', () => {


    StreamTest.versions.forEach((version) => {
      describe('for ' + version + ' streams', () => {

        it('should return a stream outputting the current time', (done) => {
          let $ = {
            in: {},
            out: {},
            services: {
              temp: {
                get: () => { return '1267833600000'; },
              },
            },
          };
          let whook = new TimeWhook();
          let outStream = new Stream.PassThrough();

          whook.init();
          assert(!whook.processOutput($, outStream));
          outStream.pipe(StreamTest[version].toText((err, text) => {
              if(err) {
                return done(err);
              }
              assert.equal(text, '1267833600000');
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
              temp: {
                get: () => { return '2010-03-06T00:00:00.000Z'; },
              },
            },
          };
          let whook = new TimeWhook();
          let outStream = new Stream.PassThrough();

          whook.init();
          assert(!whook.processOutput($, outStream));
          outStream.pipe(StreamTest[version].toText((err, text) => {
              if(err) {
                return done(err);
              }
              assert.equal(text, '2010-03-06T00:00:00.000Z');
              done();
            }));
        });

      });

    });

  });

});
