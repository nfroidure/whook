import assert from 'assert';
import neatequal from 'neatequal';
import request from 'supertest';
import streamtest from 'streamtest';

import Router from '../src/router';
import DownloadWhook from '../src/whooks/download';
import TimeWhook from '../src/whooks/time';
import StatusDestination from '../src/destinations/status';
import HeadersDestination from '../src/destinations/headers';
import NodesSource from '../src/sources/nodes';
import QueryStringSource from '../src/sources/qs';

describe('Server integration', function() {
  var router = new Router();
  var logs;
  router.source('nodes', NodesSource);
  router.source('qs', QueryStringSource);
  router.destination('status', StatusDestination);
  router.destination('headers', HeadersDestination);
  router.service('time', function() {
    return 13371337;
  });
  router.service('log', function() {
    logs.push([].slice.call(arguments, 0));
  });
  router.add(DownloadWhook.specs(), new DownloadWhook('download'));
  router.add(TimeWhook.specs(), new TimeWhook('time'));

  beforeEach(function() {
    logs = [];
  });

  describe('for GET requests', function() {

    it('should work as expected when download whook is feed', function(done) {
      request(router.callback())
      .get('/time?download=true&filename=plop.csv')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', '8')
      .expect(200)
      .end(function(err, res) {
        if(err) {
          return done(err);
        }
        assert.equal(res.text, '13371337');
        done();
      });
    });

    it('should work as expected when download whook isn\'t feed', function(done) {
      request(router.callback())
      .get('/time')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', '8')
      .expect(200)
      .end(function(err, res) {
        if(err) {
          return done(err);
        }
        assert.equal(res.text, '13371337');
        done();
      });
    });

  });

});
