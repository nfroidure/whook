import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGetOAuth2WellKnownProtectedResourceMetadata from './getOAuth2WellKnownProtectedResourceMetadata.js';
import { type LogService } from 'common-services';

describe('getOAuth2WellKnownProtectedResourceMetadata', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should return OAuth2 protected resource metadata', async () => {
    const getOAuth2WellKnownProtectedResourceMetadata =
      await initGetOAuth2WellKnownProtectedResourceMetadata({
        BASE_URL: 'https://server.example.com',
        BASE_PATH: '/v0',
        log,
      });
    const response = await getOAuth2WellKnownProtectedResourceMetadata();

    expect({
      response,
      logCalls: log.mock.calls.filter((args) => args[0].endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "logCalls": [],
        "response": {
          "body": {
            "authorization_servers": [
              "https://server.example.com/v0",
            ],
            "bearer_methods_supported": [
              "header",
            ],
            "resource": "https://server.example.com/v0",
          },
          "status": 200,
        },
      }
    `);
  });
});
