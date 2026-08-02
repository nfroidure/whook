import {
  describe,
  test,
  beforeAll,
  beforeEach,
  jest,
  expect,
} from '@jest/globals';
import initAuthentication from './authentication.js';
import { YError } from 'yerror';
import initJWT from '../services/jwtToken.js';
import { type JWTService } from 'jwt-service';
import { type TimeService } from 'common-services';
import { type WhookAuthenticationData } from '@whook/authorization';

describe('authentication', () => {
  const time = jest.fn<TimeService>();
  let jwtToken: JWTService<WhookAuthenticationData>;

  beforeAll(async () => {
    jwtToken = await initJWT({
      JWT: {
        duration: '2h',
        tolerance: '15m',
        algorithms: ['HS256'],
      },
      ENV: { JWT_SECRET: 'oudelali' },
      time,
    });
  });

  beforeEach(() => {
    time.mockReset();
  });

  describe('.check()', () => {
    describe('with bearer type', () => {
      test('should work with a good token', async () => {
        time.mockReturnValueOnce(Date.parse('1982-07-22T00:00:00Z'));

        const theToken = (
          await jwtToken.sign({
            userId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            scopes: ['admin'],
          })
        ).token;
        const authentication = await initAuthentication({ jwtToken });

        time.mockReturnValueOnce(Date.parse('1982-07-22T01:00:00Z'));

        const result = await authentication.check('bearer', {
          hash: theToken as unknown as string,
        });

        expect({
          result,
        }).toMatchInlineSnapshot(`
         {
           "result": {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "exp": 396151200,
             "iat": 396144000,
             "nbf": 396144000,
             "scopes": [
               "admin",
             ],
             "userId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
           },
         }
        `);
      });

      test('should fail with a bad token', async () => {
        const authentication = await initAuthentication({ jwtToken });

        try {
          await authentication.check('bearer', { hash: 'lol' });
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect({
            errorCode: (err as YError).code,
            errorDebug: (err as YError).debug,
          }).toMatchInlineSnapshot(`
           {
             "errorCode": "E_BAD_BEARER_TOKEN",
             "errorDebug": [
               "bearer",
               "lol",
             ],
           }
          `);
        }
      });
    });

    describe('with fake type', () => {
      test('should work with fake data', async () => {
        const authentication = await initAuthentication({ jwtToken });
        const result = await authentication.check('fake', {
          userId: 'user_id',
          scopes: ['user'],
          clientId: 'client_id',
        });

        expect({
          result,
        }).toMatchInlineSnapshot(`
         {
           "result": {
             "clientId": "client_id",
             "scopes": [
               "user",
             ],
             "userId": "user_id",
           },
         }
        `);
      });
    });

    describe('with a bad auth type', () => {
      test('should fail', async () => {
        const authentication = await initAuthentication({ jwtToken });

        try {
          await authentication.check('yolo', { hash: 'lol' });
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect({
            errorCode: (err as YError).code,
            errorDebug: (err as YError).debug,
          }).toMatchInlineSnapshot(`
           {
             "errorCode": "E_UNEXPECTED_AUTH_TYPE",
             "errorDebug": [
               "yolo",
             ],
           }
          `);
        }
      });
    });
  });
});
