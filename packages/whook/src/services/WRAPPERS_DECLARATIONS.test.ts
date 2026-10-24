import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initWrappersDeclarations from './WRAPPERS_DECLARATIONS.js';
import { type ImporterService, type LogService } from 'common-services';
import {
  WHOOK_DEFAULT_PLUGINS,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookHandlerWrapperModule } from '../types/wrappers.js';

describe('initWrappersDeclarations', () => {
  const APP_ENV = 'test';
  const WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS;
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PLUGINS[0]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'wrappers'],
    },
    [WHOOK_PLUGINS[1]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'wrappers'],
    },
  };
  const log = jest.fn<LogService>();
  const importer =
    jest.fn<ImporterService<WhookHandlerWrapperModule<unknown>>>();

  beforeEach(() => {
    log.mockReset();
  });
  test('should work', async () => {
    importer.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: (() => undefined) as any,
      definition: {
        name: 'wrapNotSkipped',
        type: 'route',
        config: {
          environments: [APP_ENV],
          targets: 'none',
        },
      },
    });

    async function* createDirectoryFilesWalker(baseURL: URL) {
      yield new URL('wrappers/skipped_file.test.ts', baseURL);
      yield new URL('wrappers/skipped_wrapper.ts', baseURL);
      yield new URL('wrappers/wrapNotSkipped.ts', baseURL);
    }

    const WRAPPERS_DECLARATIONS = await initWrappersDeclarations({
      APP_ENV,
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      importer,
      createDirectoryFilesWalker,
      log,
    });

    expect({
      WRAPPERS_DECLARATIONS,
      importerCalls: importer.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "WRAPPERS_DECLARATIONS": {
         "wrappers": {
           "wrapNotSkipped": {
             "content": {
               "config": {
                 "environments": [
                   "test",
                 ],
                 "targets": "none",
               },
               "name": "wrapNotSkipped",
               "type": "route",
             },
             "name": "wrapNotSkipped",
             "pluginName": "__project__",
             "type": "wrapper",
             "url": "file:///__project__/wrappers/wrapNotSkipped.ts",
           },
         },
       },
       "importerCalls": [
         [
           "file:///__project__/wrappers/skipped_wrapper.ts",
         ],
         [
           "file:///__project__/wrappers/wrapNotSkipped.ts",
         ],
         [
           "file:///__project__/wrappers/skipped_wrapper.ts",
         ],
         [
           "file:///__project__/wrappers/wrapNotSkipped.ts",
         ],
       ],
       "logCalls": [
         [
           "debug",
           "🈁 - Gathering the project wrappers modules.",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/wrappers/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped wrapper from "file:///__project__/wrappers/skipped_wrapper.ts" per service name patterns (tested: "skipped_wrapper").",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/wrappers/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped wrapper from "file:///__project__/wrappers/skipped_wrapper.ts" per service name patterns (tested: "skipped_wrapper").",
         ],
         [
           "debug",
           "⏳ - Skipped wrapper from "file:///__project__/wrappers/wrapNotSkipped.ts" since already loaded upstream.",
         ],
       ],
     }
    `);
  });
});
