import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initCronsDeclarations from './CRONS_DECLARATIONS.js';
import { type ImporterService, type LogService } from 'common-services';
import {
  WHOOK_DEFAULT_PLUGINS,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookCronModule } from '../types/crons.js';

describe('initCronsDeclarations', () => {
  const APP_ENV = 'test';
  const WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS;
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PLUGINS[0]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'crons'],
    },
    [WHOOK_PLUGINS[1]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'crons'],
    },
  };
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<WhookCronModule>>();

  beforeEach(() => {
    log.mockReset();
  });
  test('should work', async () => {
    importer.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: (() => undefined) as any,
      definition: {
        name: 'handleNotSkipped',
        config: {
          environments: [APP_ENV],
        },
        schedules: [],
        schema: { type: 'string' },
      },
      bodySchema: {
        name: 'Body',
        schema: {
          type: 'string',
        },
      },
    });

    async function* createDirectoryFilesWalker(baseURL: URL) {
      yield new URL('crons/skipped_file.test.ts', baseURL);
      yield new URL('crons/skipped_cron.ts', baseURL);
      yield new URL('crons/handleNotSkipped.ts', baseURL);
    }

    const CRONS_DECLARATIONS = await initCronsDeclarations({
      APP_ENV,
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      importer,
      createDirectoryFilesWalker,
      log,
    });

    expect({
      CRONS_DECLARATIONS,
      importerCalls: importer.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "CRONS_DECLARATIONS": {
         "crons": {
           "handleNotSkipped": {
             "content": {
               "config": {
                 "environments": [
                   "test",
                 ],
               },
               "name": "handleNotSkipped",
               "schedules": [],
               "schema": {
                 "type": "string",
               },
             },
             "name": "handleNotSkipped",
             "pluginName": "__project__",
             "type": "cron",
             "url": "file:///__project__/crons/handleNotSkipped.ts",
           },
         },
         "handlers": {
           "handleNotSkipped": {
             "content": undefined,
             "name": "handleNotSkipped",
             "pluginName": "__project__",
             "type": "handler",
             "url": "file:///__project__/crons/handleNotSkipped.ts",
           },
         },
         "schemas": {
           "Body": {
             "content": {
               "name": "Body",
               "schema": {
                 "type": "string",
               },
             },
             "name": "Body",
             "pluginName": "__project__",
             "type": "schema",
             "url": "file:///__project__/crons/skipped_cron.ts",
           },
         },
       },
       "importerCalls": [
         [
           "file:///__project__/crons/skipped_cron.ts",
         ],
         [
           "file:///__project__/crons/handleNotSkipped.ts",
         ],
         [
           "file:///__project__/crons/skipped_cron.ts",
         ],
         [
           "file:///__project__/crons/handleNotSkipped.ts",
         ],
       ],
       "logCalls": [
         [
           "debug",
           "🈁 - Gathering the project crons modules.",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/crons/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped cron from "file:///__project__/crons/skipped_cron.ts" per service name patterns (tested: "skipped_cron").",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/crons/skipped_cron.ts",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/crons/handleNotSkipped.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/crons/skipped_cron.ts", prevented: "file:///__project__/crons/handleNotSkipped.ts").",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/crons/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped cron from "file:///__project__/crons/skipped_cron.ts" per service name patterns (tested: "skipped_cron").",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/crons/skipped_cron.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/crons/skipped_cron.ts", prevented: "file:///__project__/crons/skipped_cron.ts").",
         ],
         [
           "debug",
           "⏳ - Skipped cron from "file:///__project__/crons/handleNotSkipped.ts" since already loaded upstream.",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/crons/handleNotSkipped.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/crons/skipped_cron.ts", prevented: "file:///__project__/crons/handleNotSkipped.ts").",
         ],
       ],
     }
    `);
  });
});
