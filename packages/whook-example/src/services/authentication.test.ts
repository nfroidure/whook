import {
  describe,
  it,
  beforeAll,
  beforeEach,
  jest,
  expect,
} from '@jest/globals';
import initAuthentication from './authentication.js';
import { YError } from 'yerror';
import initJWT from '../services/jwtToken.js';
import { type AuthenticationData } from './authentication.js';
import { type JWTService } from 'jwt-service';
import { type TimeService } from 'common-services';

describe('authentication', () => {
  const time = jest.fn<TimeService>();
  let jwtToken: JWTService<AuthenticationData>;

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
      it('should work with a good token', async () => {
        time.mockReturnValueOnce(Date.parse('1982-07-22T00:00:00Z'));

        const theToken = (
          await jwtToken.sign({
            applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            userId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
            scope: 'admin',
          })
        ).token;
        const authentication = await initAuthentication({ jwtToken });

        time.mockReturnValueOnce(Date.parse('1982-07-22T01:00:00Z'));

        const result = await authentication.check('bearer', {
          hash: theToken as unknown as string,
        });

        expect({
          result,
        }).toMatchSnapshot();
      });

      it('should fail with a bad token', async () => {
        const authentication = await initAuthentication({ jwtToken });

        try {
          await authentication.check('bearer', { hash: 'lol' });
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect({
            errorCode: (err as YError).code,
            errorParams: (err as YError).params,
          }).toMatchSnapshot();
        }
      });
    });

    describe('with fake type', () => {
      it('should work with fakedata', async () => {
        const authentication = await initAuthentication({ jwtToken });
        const result = await authentication.check('fake', {
          applicationId: '1',
          userId: '1',
          scope: 'user',
        });

        expect({
          result,
        }).toMatchSnapshot();
      });
    });

    describe('with a bad auth type', () => {
      it('should fail', async () => {
        const authentication = await initAuthentication({ jwtToken });

        try {
          await authentication.check('yolo', { hash: 'lol' });
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect({
            errorCode: (err as YError).code,
            errorParams: (err as YError).params,
          }).toMatchSnapshot();
        }
      });
    });
  });
});
