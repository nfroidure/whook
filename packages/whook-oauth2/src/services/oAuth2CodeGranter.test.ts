import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { type WhookAuthenticationData } from '@whook/authorization';
import {
  type CheckApplicationService,
  type OAuth2CodeService,
} from './oAuth2Granters.js';
import initOAuth2CodeGranter, {
  base64UrlEncode,
  hashCodeVerifier,
} from './oAuth2CodeGranter.js';

describe('OAuth2CodeGranter', () => {
  const oAuth2Code = {
    create: jest.fn<OAuth2CodeService<string>['create']>(),
    check: jest.fn<OAuth2CodeService<string>['check']>(),
  };
  const checkApplication = jest.fn<CheckApplicationService>();
  const log = jest.fn();

  beforeEach(() => {
    oAuth2Code.create.mockReset();
    oAuth2Code.check.mockReset();
    checkApplication.mockReset();
    log.mockReset();
  });

  test('should work with a complete valid flow', async () => {
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
    } as WhookAuthenticationData & {
      redirectURI: string;
      [name: string]: unknown;
    });

    const authorizerResult = await oAuth2CodeGranter.authorizer?.authorize(
      {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirectURI: 'https://www.example.com/oauth2/code',
        scope: 'user',
      },
      {
        codeChallenge: '',
        codeChallengeMethod: 'plain',
      },
    );
    const acknowledgerResult =
      await oAuth2CodeGranter.acknowledger?.acknowledge(
        {
          applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          scope: 'user, admin',
        } as WhookAuthenticationData,
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          redirectURI: 'https://www.example.com/oauth2/code',
          scope: 'user',
        },
        {
          codeChallenge: '',
          codeChallengeMethod: 'plain',
        },
      );
    const authenticatorResult =
      await oAuth2CodeGranter.authenticator?.authenticate(
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          redirectURI: 'https://www.example.com/oauth2/code',
          code: 'yolo',
          codeVerifier: '',
        },
        {
          applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          scope: 'user',
        } as WhookAuthenticationData,
      );

    expect({
      authorizerResult,
      acknowledgerResult,
      authenticatorResult,
    }).toMatchInlineSnapshot(`
      {
        "acknowledgerResult": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "code": "yolo",
          "redirectURI": "https://www.example.com/oauth2/code",
          "scope": "user",
        },
        "authenticatorResult": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "redirectURI": "https://www.example2.com",
          "scope": "user",
        },
        "authorizerResult": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "codeChallenge": "",
          "codeChallengeMethod": "plain",
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

describe('base64UrlEncode()', () => {
  test('should work like here  https://tools.ietf.org/html/rfc7636#appendix-A', () => {
    expect(
      base64UrlEncode(
        Buffer.from([
          116, 24, 223, 180, 151, 153, 224, 37, 79, 250, 96, 125, 216, 173, 187,
          186, 22, 212, 37, 77, 105, 214, 191, 240, 91, 88, 5, 88, 83, 132, 141,
          121,
        ]),
      ),
    ).toEqual('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
  });
});

describe('base64UrlEncode()', () => {
  test('should work with plain method', () => {
    expect(
      hashCodeVerifier(
        Buffer.from('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
        'plain',
      ),
    ).toEqual(Buffer.from('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'));
  });

  test('should work with S256 like here https://tools.ietf.org/html/rfc7636#appendix-A', () => {
    expect(
      hashCodeVerifier(
        Buffer.from('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
        'S256',
      ),
    ).toEqual(
      Buffer.from([
        19, 211, 30, 150, 26, 26, 216, 236, 47, 22, 177, 12, 76, 152, 46, 8,
        118, 168, 120, 173, 109, 241, 68, 86, 110, 225, 137, 74, 203, 112, 249,
        195,
      ]),
    );
  });

  test('should work base64 url encode like here https://tools.ietf.org/html/rfc7636#appendix-A', () => {
    expect(
      base64UrlEncode(
        hashCodeVerifier(
          Buffer.from('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
          'S256',
        ),
      ),
    ).toEqual('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});
