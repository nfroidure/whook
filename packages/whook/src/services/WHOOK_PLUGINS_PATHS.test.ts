import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initWhookPluginsPaths from './WHOOK_PLUGINS_PATHS.js';
import { YError } from 'yerror';
import type { LogService } from 'common-services';

describe('WHOOK_PLUGINS_PATHS', () => {
  const log = jest.fn<LogService>();
  const resolve = jest.fn();

  beforeEach(() => {
    log.mockReset();
    resolve.mockReset();
  });

  describe('should work', () => {
    it('with no plugin at all', async () => {
      const WHOOK_PLUGINS_PATHS = await initWhookPluginsPaths({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        resolve: resolve as unknown as RequireResolve,
        log,
      });

      expect({
        WHOOK_PLUGINS_PATHS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "WHOOK_PLUGINS_PATHS": [],
  "logCalls": [],
  "resolveCalls": [],
}
`);
    });

    it('with some plugins', async () => {
      resolve.mockImplementationOnce(
        () => '/var/lib/node/node_modules/@whook/graphql',
      );
      resolve.mockImplementationOnce(
        () => '/var/lib/node/node_modules/@whook/whook',
      );

      const WHOOK_PLUGINS_PATHS = await initWhookPluginsPaths({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: ['@whook/graphql', '@whook/whook'],
        resolve: resolve as unknown as RequireResolve,
        log,
      });

      expect({
        WHOOK_PLUGINS_PATHS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "WHOOK_PLUGINS_PATHS": [
    "/var/lib/node/node_modules/@whook",
    "/var/lib/node/node_modules/@whook",
  ],
  "logCalls": [
    [
      "debug",
      "➰ - Plugin "@whook/graphql" resolved to "/var/lib/node/node_modules/@whook".",
    ],
    [
      "debug",
      "➰ - Plugin "@whook/whook" resolved to "/var/lib/node/node_modules/@whook".",
    ],
  ],
  "resolveCalls": [
    [
      "@whook/graphql",
      {
        "paths": [
          "/home/whoami/my-whook-project/src",
        ],
      },
    ],
    [
      "@whook/whook",
      {
        "paths": [
          "/home/whoami/my-whook-project/src",
        ],
      },
    ],
  ],
}
`);
    });
  });

  describe('should fail', () => {
    it('with unexisting plugin', async () => {
      resolve.mockImplementationOnce(() => {
        throw new YError('E_NO_MODULE');
      });

      try {
        await initWhookPluginsPaths({
          PROJECT_SRC: '/home/whoami/my-whook-project/src',
          WHOOK_PLUGINS: ['@whook/unreal'],
          log,
          resolve: resolve as unknown as RequireResolve,
        });

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          resolveCalls: resolve.mock.calls,
        }).toMatchInlineSnapshot(`
{
  "errorCode": "E_BAD_WHOOK_PLUGIN",
  "errorParams": [
    "@whook/unreal",
  ],
  "logCalls": [],
  "resolveCalls": [
    [
      "@whook/unreal",
      {
        "paths": [
          "/home/whoami/my-whook-project/src",
        ],
      },
    ],
  ],
}
`);
      }
    });
  });
});
