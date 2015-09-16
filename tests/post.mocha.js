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

  router.destination('status', StatusDestination);
  router.destination('headers', HeadersDestination);
  router.source('headers', HeadersSource);
  router.service('log', (..._args) => {
    logs.push(_args);
  });
  router.add(EchoWhook.specs(), new EchoWhook('echo'));

  beforeEach(() => {
    logs = [];
  });

  describe('for POST requests', () => {

    it('should 404 for unexisting routes', (done) => {
      request(router.callback())
      .post('/kikoolol')
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
      .post('/echo')
      .send('1267833600000')
      .set('Content-Type', 'text/plain')
      .set('Content-Length', '13')
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
