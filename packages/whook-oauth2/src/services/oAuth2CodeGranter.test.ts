import { jest } from '@jest/globals';
import { BaseAuthenticationData } from '@whook/authorization';
import initOAuth2CodeGranter from './oAuth2CodeGranter.js';
import {
  CheckApplicationService,
  OAuth2CodeService,
} from './oAuth2Granters.js';

describe('OAuth2CodeGranter', () => {
  const oAuth2Code = {
    create:
      jest.fn<
        OAuth2CodeService<
          BaseAuthenticationData<string, string>,
          string
        >['create']
      >(),
    check:
      jest.fn<
        OAuth2CodeService<
          BaseAuthenticationData<string, string>,
          string
        >['check']
      >(),
  };
  const checkApplication = jest.fn<CheckApplicationService>();
  const log = jest.fn();

  beforeEach(() => {
    oAuth2Code.create.mockReset();
    oAuth2Code.check.mockReset();
    checkApplication.mockReset();
    log.mockReset();
  });

  it('should work with a complete valid flow', async () => {
    const oAuth2CodeGranter = await initOAuth2CodeGranter({
      checkApplication,
      oAuth2Code,
      log,
    });

    checkApplication.mockResolvedValue({
      redirectURI: 'https://www.example.com',
      type: 'a_type',
      scope: 'a_scope',
      applicationId: 'abbacaca-abba-caca-abba-cacaabbac0c0',
    });
    oAuth2Code.create.mockResolvedValueOnce('yolo');
    oAuth2Code.check.mockResolvedValueOnce({
      redirectURI: 'https://www.example2.com',
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      scope: 'user',
    });

    const authorizerResult = await oAuth2CodeGranter.authorizer?.authorize({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      redirectURI: 'https://www.example.com/oauth2/code',
      scope: 'user',
    });
    const acknowledgerResult =
      await oAuth2CodeGranter.acknowledger?.acknowledge(
        {
          applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          scope: 'user, admin',
        },
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          redirectURI: 'https://www.example.com/oauth2/code',
          scope: 'user',
        },
        {},
      );
    const authenticatorResult =
      await oAuth2CodeGranter.authenticator?.authenticate(
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          redirectURI: 'https://www.example.com/oauth2/code',
          code: 'yolo',
        },
        {
          applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          scope: 'user',
        },
      );

    expect({
      authorizerResult,
      acknowledgerResult,
      authenticatorResult,
    }).toMatchInlineSnapshot(`
      Object {
        "acknowledgerResult": Object {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "code": "yolo",
          "redirectURI": "https://www.example.com/oauth2/code",
          "scope": "user",
        },
        "authenticatorResult": Object {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "redirectURI": "https://www.example2.com",
          "scope": "user",
        },
        "authorizerResult": Object {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "redirectURI": "https://www.example.com",
          "scope": "user",
        },
      }
    `);
    expect({
      oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
      oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
      checkApplicationCalls: checkApplication.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });
});
