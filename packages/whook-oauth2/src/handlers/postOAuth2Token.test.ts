import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostOAuth2Token from './postOAuth2Token.js';
import { YError } from 'yerror';
import { type LogService, type TimeService } from 'common-services';
import {
  type OAuth2GranterService,
  type OAuth2AccessTokenService,
  type OAuth2RefreshTokenService,
} from '../index.js';
import { type OAuth2CodeGranterService } from '../services/oAuth2CodeGranter.js';
import { type OAuth2TokenGranterService } from '../services/oAuth2TokenGranter.js';
import { type OAuth2PasswordGranterService } from '../services/oAuth2PasswordGranter.js';
import { type OAuth2RefreshTokenGranterService } from '../services/oAuth2RefreshTokenGranter.js';

describe('postOAuth2Token', () => {
  const log = jest.fn<LogService>();
  const time = jest.fn<TimeService>();
  const oAuth2AccessToken = {
    create: jest.fn<OAuth2AccessTokenService['create']>(),
    check: jest.fn<OAuth2AccessTokenService['check']>(),
  };
  const oAuth2RefreshToken = {
    create: jest.fn<OAuth2RefreshTokenService['create']>(),
    check: jest.fn<OAuth2RefreshTokenService['check']>(),
  };
  const codeGranter = {
    type: 'code',
    authorizer: {
      responseType: 'code',
      authorize:
        jest.fn<
          NonNullable<OAuth2CodeGranterService['authorizer']>['authorize']
        >(),
    },
    acknowledger: {
      acknowledgmentType: 'code',
      acknowledge:
        jest.fn<
          NonNullable<OAuth2CodeGranterService['acknowledger']>['acknowledge']
        >(),
    },
    authenticator: {
      grantType: 'authorization_code',
      authenticate:
        jest.fn<
          NonNullable<OAuth2CodeGranterService['authenticator']>['authenticate']
        >(),
    },
  };
  const passwordGranter = {
    type: 'password',
    authenticator: {
      grantType: 'password',
      authenticate:
        jest.fn<
          NonNullable<
            OAuth2PasswordGranterService['authenticator']
          >['authenticate']
        >(),
    },
  };
  const clientCredentialsGranter = {
    type: 'client_credentials',
    authenticator: {
      grantType: 'client_credentials',
      authenticate:
        jest.fn<
          NonNullable<OAuth2CodeGranterService['authorizer']>['authorize']
        >(),
    },
  };
  const tokenGranter = {
    type: 'token',
    authorizer: {
      responseType: 'token',
      authorize:
        jest.fn<
          NonNullable<
            OAuth2TokenGranterService['authenticator']
          >['authenticate']
        >(),
    },
    acknowledger: {
      acknowledgmentType: 'token',
      acknowledge:
        jest.fn<
          NonNullable<OAuth2TokenGranterService['acknowledger']>['acknowledge']
        >(),
    },
  };
  const refreshTokenGranter = {
    type: 'refresh',
    authenticator: {
      grantType: 'refresh',
      authenticate:
        jest.fn<
          NonNullable<
            OAuth2RefreshTokenGranterService['authenticator']
          >['authenticate']
        >(),
    },
  };
  const oAuth2Granters = [
    codeGranter,
    tokenGranter,
    passwordGranter,
    refreshTokenGranter,
    clientCredentialsGranter,
  ] as unknown as OAuth2GranterService[];

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
      redirectURI: 'http://lol',
      scope: 'user,admin',
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
        {
          "errorCode": "E_UNKNOWN_AUTHENTICATOR_TYPE",
          "errorParams": [
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
