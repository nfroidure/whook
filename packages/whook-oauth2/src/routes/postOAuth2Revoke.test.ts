import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { YError } from 'yerror';
import initPostOAuth2Revoke from './postOAuth2Revoke.js';
import {
  type WhookOAuth2RevokeTokenService,
  type WhookOAuth2RevocationTokenTypeHint,
} from './postOAuth2Revoke.js';
import { type LogService } from 'common-services';

describe('postOAuth2Revoke', () => {
  const oAuth2RevokeToken = {
    revoke: jest.fn<WhookOAuth2RevokeTokenService['revoke']>(),
  };
  const log = jest.fn<LogService>();

  beforeEach(() => {
    oAuth2RevokeToken.revoke.mockReset();
    log.mockReset();
  });

  test('should revoke a token', async () => {
    oAuth2RevokeToken.revoke.mockResolvedValueOnce();
    const postOAuth2Revoke = await initPostOAuth2Revoke({
      oAuth2RevokeToken,
      log,
    });
    const response = await postOAuth2Revoke({
      body: {
        token: 'a_token',
        token_type_hint: 'refresh_token' as WhookOAuth2RevocationTokenTypeHint,
      },
      authenticationData: {
        clientId: 'a_client',
        scopes: ['oauth'],
      },
    });

    expect({
      response,
      oAuth2RevokeTokenRevokeCalls: oAuth2RevokeToken.revoke.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [],
       "oAuth2RevokeTokenRevokeCalls": [
         [
           "a_token",
           {
             "clientId": "a_client",
             "scopes": [
               "oauth",
             ],
           },
           "refresh_token",
         ],
       ],
       "response": {
         "status": 200,
       },
     }
    `);
  });

  test('should ignore already invalid tokens', async () => {
    oAuth2RevokeToken.revoke.mockRejectedValueOnce(new YError('E_BAD_TOKEN'));
    const postOAuth2Revoke = await initPostOAuth2Revoke({
      oAuth2RevokeToken,
      log,
    });
    const response = await postOAuth2Revoke({
      body: {
        token: 'already_invalid',
      },
    });

    expect({
      response,
      oAuth2RevokeTokenRevokeCalls: oAuth2RevokeToken.revoke.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [],
       "oAuth2RevokeTokenRevokeCalls": [
         [
           "already_invalid",
           undefined,
           undefined,
         ],
       ],
       "response": {
         "status": 200,
       },
     }
    `);
  });

  test('should bubble up unexpected errors', async () => {
    oAuth2RevokeToken.revoke.mockRejectedValueOnce(
      new YError('E_OAUTH2_UNEXPECTED_ERROR'),
    );
    const postOAuth2Revoke = await initPostOAuth2Revoke({
      oAuth2RevokeToken,
      log,
    });

    await expect(
      postOAuth2Revoke({
        body: {
          token: 'a_token',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_UNEXPECTED_ERROR',
    });
    expect(log.mock.calls.length).toBe(2);
  });
});
