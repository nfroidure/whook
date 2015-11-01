import assert from 'assert';
import request from 'supertest';

import Router from '../src/router';
import EchoWhook from '../src/whooks/echo';
import StatusDestination from '../src/destinations/status';
import HeadersSource from '../src/sources/headers';
import HeadersDestination from '../src/destinations/headers';

describe('Server integration', () => {
  let router = new Router();
  let logs;
  let tempValue;

  router.destination('status', StatusDestination);
  router.destination('headers', HeadersDestination);
  router.source('headers', HeadersSource);
  router.service('log', (..._args) => {
    logs.push(_args);
  });
  router.service('temp', {
    set: (key, val) => { tempValue = val; },
    get: () => { return tempValue; },
  });
  router.add(EchoWhook.specs({
    statusCode: 201,
  }), new EchoWhook('echo'));

  beforeEach(() => {
    logs = [];
  });

  describe('for PUT requests', () => {

    it('should 404 for unexisting routes', (done) => {
      request(router.callback())
      .put('/kikoolol')
      .send({
        plop: 'wadup',
      })
      .set('Accept', 'application/json')
      .expect(404)
      .end((err) => {
        if(err) {
          return done(err);
        }
        done();
      });
    });

    it('should work as expected', (done) => {
      request(router.callback())
      .put('/echo')
      .send('1267833600000')
      .set('Content-Type', 'text/plain')
      .set('Content-Length', '13')
      .expect('Content-Type', 'text/plain')
      .expect('Content-Length', '13')
      .expect(201)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        assert.equal(res.text, '1267833600000');
        done();
      });
    });

    it('should fail with bad input', (done) => {
      request(router.callback())
      .put('/echo')
      .send('1267833600000')
      .set('Content-Type', 'image/png')
      .expect(400)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        assert.equal(res.text, '');
        done();
      });
    });

  });

});
