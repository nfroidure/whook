import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initConsumersDeclarations from './CONSUMERS_DECLARATIONS.js';
import { type ImporterService, type LogService } from 'common-services';
import {
  WHOOK_DEFAULT_PLUGINS,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookConsumerModule } from '../types/consumers.js';

describe('initConsumersDeclarations', () => {
  const APP_ENV = 'test';
  const WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS;
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PLUGINS[0]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'consumers'],
    },
    [WHOOK_PLUGINS[1]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'consumers'],
    },
  };
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<WhookConsumerModule>>();

  beforeEach(() => {
    log.mockReset();
  });
  test('should work', async () => {
    importer.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: (() => undefined) as any,
      definition: {
        name: 'consumeNotSkipped',
        config: {
          environments: [APP_ENV],
        },
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
      yield new URL('consumers/skipped_file.test.ts', baseURL);
      yield new URL('consumers/skipped_consumer.ts', baseURL);
      yield new URL('consumers/consumeNotSkipped.ts', baseURL);
    }

    const CONSUMERS_DECLARATIONS = await initConsumersDeclarations({
      APP_ENV,
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      importer,
      createDirectoryFilesWalker,
      log,
    });

    expect({
      CONSUMERS_DECLARATIONS,
      importerCalls: importer.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "CONSUMERS_DECLARATIONS": {
         "consumers": {
           "consumeNotSkipped": {
             "content": {
               "config": {
                 "environments": [
                   "test",
                 ],
               },
               "name": "consumeNotSkipped",
               "schema": {
                 "type": "string",
               },
             },
             "name": "consumeNotSkipped",
             "pluginName": "__project__",
             "type": "consumer",
             "url": "file:///__project__/consumers/consumeNotSkipped.ts",
           },
         },
         "handlers": {
           "consumeNotSkipped": {
             "content": undefined,
             "name": "consumeNotSkipped",
             "pluginName": "__project__",
             "type": "handler",
             "url": "file:///__project__/consumers/consumeNotSkipped.ts",
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
             "url": "file:///__project__/consumers/skipped_consumer.ts",
           },
         },
       },
       "importerCalls": [
         [
           "file:///__project__/consumers/skipped_consumer.ts",
         ],
         [
           "file:///__project__/consumers/consumeNotSkipped.ts",
         ],
         [
           "file:///__project__/consumers/skipped_consumer.ts",
         ],
         [
           "file:///__project__/consumers/consumeNotSkipped.ts",
         ],
       ],
       "logCalls": [
         [
           "debug",
           "🈁 - Gathering the project consumers modules.",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/consumers/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped consumer from "file:///__project__/consumers/skipped_consumer.ts" per service name patterns (tested: "skipped_consumer").",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/consumers/skipped_consumer.ts",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/consumers/consumeNotSkipped.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/consumers/skipped_consumer.ts", prevented: "file:///__project__/consumers/consumeNotSkipped.ts").",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/consumers/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped consumer from "file:///__project__/consumers/skipped_consumer.ts" per service name patterns (tested: "skipped_consumer").",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/consumers/skipped_consumer.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/consumers/skipped_consumer.ts", prevented: "file:///__project__/consumers/skipped_consumer.ts").",
         ],
         [
           "debug",
           "⏳ - Skipped consumer from "file:///__project__/consumers/consumeNotSkipped.ts" since already loaded upstream.",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/consumers/consumeNotSkipped.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/consumers/skipped_consumer.ts", prevented: "file:///__project__/consumers/consumeNotSkipped.ts").",
         ],
       ],
     }
    `);
  });
});
