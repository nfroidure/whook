var assert = require('assert');
var neatequal = require('neatequal');
var StreamTest = require('streamtest');

describe('TimeWhook', function() {
  var TimeWhook = require('./../../dist/whooks/time');

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
      var $ = {
        in: {},
        out: {}
      };
      var whook = new TimeWhook();
      whook.init();
      whook.pre($, function() {
        neatequal($.out, {
          contentType: 'text/plain'
        });
      });
    });
  });

  describe('process()', function() {


    StreamTest.versions.forEach(function(version) {
      describe('for ' + version + ' streams', function() {

        it('should return a stream outputting the current time', function() {
          var $ = {
            in: {},
            out: {},
            services: {
              time: function() {
                return 13371337;
              },
              log: function() {
                args = [].slice.call(arguments, 0);
              }
            }
          };
          var whook = new TimeWhook();
          whook.init();
          whook.process($).pipe(StreamTest[version].toText(function(err, text) {
            if(err) {
              done(err);
            }
            assert.equal(text, '13371337');
            done();
          }));
        });

        it('should log when a log service is available', function() {
          var args;
          var $ = {
            in: {
              format: 'iso'
            },
            out: {},
            services: {
              time: function() {
                return 13371337;
              },
              log: function() {
                args = [].slice.call(arguments, 0);
              }
            }
          };
          var whook = new TimeWhook();
          whook.init();
          whook.process($).pipe(StreamTest[version].toText(function(err, text) {
            if(err) {
              done(err);
            }
            assert.equal(text, 'Thu Jan 01 1970 04:42:51 GMT+0100 (CET)');
            done();
          }));
        });

      });

    });

  });

});