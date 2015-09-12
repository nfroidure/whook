import assert from 'assert';
import request from 'supertest';

import Router from '../src/router';
import DownloadWhook from '../src/whooks/download';
import TimeWhook from '../src/whooks/time';
import StatusDestination from '../src/destinations/status';
import HeadersDestination from '../src/destinations/headers';
import NodesSource from '../src/sources/nodes';
import QueryStringSource from '../src/sources/qs';
import initTimeMock from 'sf-time-mock';

describe('Server integration', () => {
  let router = new Router();
  let logs;
  let timeStub = initTimeMock();

  router.source('nodes', NodesSource);
  router.source('qs', QueryStringSource);
  router.destination('status', StatusDestination);
  router.destination('headers', HeadersDestination);
  router.service('time', {
    now: timeStub,
  });
  router.service('log', (..._args) => {
    logs.push(_args);
  });
  router.add(DownloadWhook.specs(), new DownloadWhook('download'));
  router.add(TimeWhook.specs(), new TimeWhook('time'));

  beforeEach(() => {
    logs = [];
    timeStub.setTime(1267833600000);
  });

  describe('for GET requests', () => {

    it('should 404 for unexisting routes', (done) => {
      request(router.callback())
      .get('/idonotexist')
      .expect(404)
      .end((err) => {
        if(err) {
          return done(err);
        }
        done();
      });
    });

    it('should work as expected when download whook is feed', (done) => {
      request(router.callback())
      .get('/time?download=true&filename=plop.csv')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', '13')
      .expect(200)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        assert.equal(res.text, '1267833600000');
        done();
      });
    });

    it('should work as expected when download whook isn\'t feed', (done) => {
      request(router.callback())
      .get('/time')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', '13')
      .expect(200)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        assert.equal(res.text, '1267833600000');
        done();
      });
    });

  });

});
