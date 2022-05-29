import initPostOAuth2Token from './postOAuth2Token';
import { YError } from 'yerror';
import type { OAuth2GranterService } from '..';

describe('postOAuth2Token', () => {
  const log = jest.fn();
  const time = jest.fn();
  const oAuth2AccessToken = { create: jest.fn(), check: jest.fn() };
  const oAuth2RefreshToken = { create: jest.fn(), check: jest.fn() };
  const codeGranter = {
    type: 'code',
    authorizer: { responseType: 'code', authorize: jest.fn() },
    acknowledger: { acknowledgmentType: 'code', acknowledge: jest.fn() },
    authenticator: {
      grantType: 'authorization_code',
      authenticate: jest.fn(),
    },
  };
  const passwordGranter = {
    type: 'password',
    authenticator: {
      grantType: 'password',
      authenticate: jest.fn(),
    },
  };
  const clientCredentialsGranter = {
    type: 'client_credentials',
    authenticator: {
      grantType: 'client_credentials',
      authenticate: jest.fn(),
    },
  };
  const tokenGranter = {
    type: 'token',
    authorizer: { responseType: 'token', authorize: jest.fn() },
    acknowledger: { acknowledgmentType: 'token', acknowledge: jest.fn() },
  };
  const refreshTokenGranter = {
    type: 'refresh',
    authenticator: {
      grantType: 'refresh',
      authenticate: jest.fn(),
    },
  };
  const oAuth2Granters: OAuth2GranterService[] = [
    codeGranter,
    tokenGranter,
    passwordGranter,
    refreshTokenGranter,
    clientCredentialsGranter,
  ];

  beforeEach(() => {
    log.mockReset();
    time.mockReset();
    oAuth2AccessToken.create.mockReset();
    oAuth2AccessToken.check.mockReset();
    oAuth2RefreshToken.create.mockReset();
    oAuth2RefreshToken.check.mockReset();
    codeGranter.authorizer.authorize.mockReset();
    codeGranter.acknowledger.acknowledge.mockReset();
    codeGranter.authenticator.authenticate.mockReset();
    tokenGranter.authorizer.authorize.mockReset();
    tokenGranter.acknowledger.acknowledge.mockReset();
    passwordGranter.authenticator.authenticate.mockReset();
    refreshTokenGranter.authenticator.authenticate.mockReset();
    clientCredentialsGranter.authenticator.authenticate.mockReset();
  });

  test('should create a token', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    oAuth2AccessToken.create.mockResolvedValueOnce({
      token: 'an_access_token',
      expiresAt: Date.parse('2010-03-07T00:00:00Z'),
    });
    oAuth2RefreshToken.create.mockResolvedValueOnce({
      token: 'a_refresh_token',
      expiresAt: Date.parse('2180-03-06T00:00:00Z'),
    });
    codeGranter.authorizer.authorize.mockResolvedValueOnce({
      applicationId: '',
    });

    const postOAuth2Token = await initPostOAuth2Token({
      oAuth2Granters,
      oAuth2AccessToken,
      oAuth2RefreshToken,
      time,
      log,
    });
    const response = await postOAuth2Token({
      authenticationData: {
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scope: 'user',
      },
      body: {
        grant_type: 'authorization_code',
        code: '007',
        client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirect_uri: 'http://lol',
      },
    });
    expect({
      response,
      oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
      oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  test('should fail with a bad grant type', async () => {
    const postOAuth2Token = await initPostOAuth2Token({
      oAuth2Granters,
      oAuth2AccessToken,
      oAuth2RefreshToken,
      time,
      log,
    });

    try {
      await postOAuth2Token({
        authenticationData: {
          applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          scope: 'user',
        },
        body: {
          grant_type: 'yolo',
          code: '007',
          client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
          redirect_uri: 'http://lol',
        },
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
      }).toMatchInlineSnapshot(`
        Object {
          "errorCode": "E_UNKNOWN_AUTHENTICATOR_TYPE",
          "errorParams": Array [
            "yolo",
          ],
        }
      `);
      expect({
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });
});
