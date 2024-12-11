import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initWhookPluginsPaths, {
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookResolvedPluginsDependencies,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { YError } from 'yerror';
import { type LogService, type ResolveService } from 'common-services';

describe('WHOOK_RESOLVED_PLUGINS', () => {
  const MAIN_FILE_URL = 'file:///home/whoiam/project/src/index.ts';
  const log = jest.fn<LogService>();
  const resolve = jest.fn<ResolveService>();
  const readDir = jest.fn<WhookResolvedPluginsDependencies['readDir']>();

  beforeEach(() => {
    log.mockReset();
    resolve.mockReset();
    readDir.mockReset();
  });

  describe('should work', () => {
    it('with no plugin at all', async () => {
      const WHOOK_RESOLVED_PLUGINS = await initWhookPluginsPaths({
        MAIN_FILE_URL,
        WHOOK_PLUGINS: [],
        resolve,
        readDir,
        log,
      });

      expect({
        WHOOK_RESOLVED_PLUGINS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "WHOOK_RESOLVED_PLUGINS": {},
  "logCalls": [],
  "resolveCalls": [],
}
`);
    });

    it('with some plugins', async () => {
      resolve.mockReturnValueOnce(
        'file:///var/lib/node/node_modules/@whook/graphql/dist/index.js',
      );
      resolve.mockReturnValueOnce(
        'file:///var/lib/node/node_modules/@whook/whook/dist/index.js',
      );
      readDir.mockResolvedValueOnce(['handlers', 'wrappers', 'libs']);
      readDir.mockResolvedValueOnce(['services', 'libs']);
      readDir.mockResolvedValueOnce(['handlers']);

      const WHOOK_RESOLVED_PLUGINS = await initWhookPluginsPaths({
        MAIN_FILE_URL,
        WHOOK_PLUGINS: [
          WHOOK_PROJECT_PLUGIN_NAME,
          '@whook/graphql',
          '@whook/whook',
        ],
        resolve,
        readDir,
        log,
      });

      expect({
        WHOOK_RESOLVED_PLUGINS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "WHOOK_RESOLVED_PLUGINS": {
    "@whook/graphql": {
      "mainURL": "file:///var/lib/node/node_modules/@whook/graphql/dist/index.js",
      "types": [
        "services",
      ],
    },
    "@whook/whook": {
      "mainURL": "file:///var/lib/node/node_modules/@whook/whook/dist/index.js",
      "types": [
        "handlers",
      ],
    },
    "__project__": {
      "mainURL": "file:///home/whoiam/project/src/index.ts",
      "types": [
        "handlers",
        "wrappers",
      ],
    },
  },
  "logCalls": [
    [
      "debug",
      "➰ - Plugin "__project__" source path resolved to "file:///home/whoiam/project/src" with "handlers, wrappers" types.",
    ],
    [
      "debug",
      "➰ - Plugin "@whook/graphql" source path resolved to "file:///var/lib/node/node_modules/@whook/graphql/dist" with "services" types.",
    ],
    [
      "debug",
      "➰ - Plugin "@whook/whook" source path resolved to "file:///var/lib/node/node_modules/@whook/whook/dist" with "handlers" types.",
    ],
  ],
  "resolveCalls": [
    [
      "@whook/graphql",
    ],
    [
      "@whook/whook",
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
          MAIN_FILE_URL,
          WHOOK_PLUGINS: ['@whook/unreal'],
          resolve,
          readDir,
          log,
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
  "logCalls": [
    [
      "error",
      "❌ - Plugin "@whook/unreal" couldn't be resolved.",
    ],
  ],
  "resolveCalls": [
    [
      "@whook/unreal",
    ],
  ],
}
`);
      }
    });
  });
});
