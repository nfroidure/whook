import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initTransformersDeclarations from './TRANSFORMERS_DECLARATIONS.js';
import { type ImporterService, type LogService } from 'common-services';
import {
  WHOOK_DEFAULT_PLUGINS,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookTransformerModule } from '../types/transformers.js';

describe('initTransformersDeclarations', () => {
  const APP_ENV = 'test';
  const WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS;
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PLUGINS[0]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'transformers'],
    },
    [WHOOK_PLUGINS[1]]: {
      mainURL: `file:///${WHOOK_PLUGINS[1]}/src`,
      types: ['routes', 'transformers'],
    },
  };
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<WhookTransformerModule>>();

  beforeEach(() => {
    log.mockReset();
  });
  test('should work', async () => {
    importer.mockImplementation(() =>
      Promise.resolve({
        default: (() =>
          undefined) as unknown as WhookTransformerModule['default'],
        definition: {
          name: 'transformNotSkipped',
          config: {
            environments: [APP_ENV],
          },
          inputSchema: { type: 'string' },
          outputSchema: { type: 'string' },
        },
        bodySchema: {
          name: 'Body',
          schema: {
            type: 'string',
          },
        },
      }),
    );

    async function* createDirectoryFilesWalker(baseURL: URL) {
      yield new URL('transformers/skipped_file.test.ts', baseURL);
      if (baseURL.pathname.includes(WHOOK_PLUGINS[1])) {
        yield new URL('transformers/skipped_transformer.ts', baseURL);
      } else {
        yield new URL('transformers/transformNotSkipped.ts', baseURL);
      }
    }

    const TRANSFORMERS_DECLARATIONS = await initTransformersDeclarations({
      APP_ENV,
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      importer,
      createDirectoryFilesWalker,
      log,
    });

    expect({
      TRANSFORMERS_DECLARATIONS,
      importerCalls: importer.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "TRANSFORMERS_DECLARATIONS": {
         "handlers": {
           "transformNotSkipped": {
             "content": undefined,
             "name": "transformNotSkipped",
             "pluginName": "__project__",
             "type": "handler",
             "url": "file:///__project__/transformers/transformNotSkipped.ts",
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
             "url": "file:///__project__/transformers/transformNotSkipped.ts",
           },
         },
         "transformers": {
           "transformNotSkipped": {
             "content": {
               "config": {
                 "environments": [
                   "test",
                 ],
               },
               "inputSchema": {
                 "type": "string",
               },
               "name": "transformNotSkipped",
               "outputSchema": {
                 "type": "string",
               },
             },
             "name": "transformNotSkipped",
             "pluginName": "__project__",
             "type": "transformer",
             "url": "file:///__project__/transformers/transformNotSkipped.ts",
           },
         },
       },
       "importerCalls": [
         [
           "file:///__project__/transformers/transformNotSkipped.ts",
         ],
         [
           "file:///@whook/whook/transformers/skipped_transformer.ts",
         ],
       ],
       "logCalls": [
         [
           "debug",
           "🈁 - Gathering the project transformers modules.",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/transformers/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⚠️ - Picking a new declaration in plugin "__project__" (type: "handler", name: "transformNotSkipped".",
         ],
         [
           "debug",
           "⚠️ - Picking a new declaration in plugin "__project__" (type: "transformer", name: "transformNotSkipped".",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/transformers/transformNotSkipped.ts",
         ],
         [
           "debug",
           "⚠️ - Picking a new declaration in plugin "__project__" (type: "schema", name: "Body".",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///@whook/whook/transformers/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped transformer from "file:///@whook/whook/transformers/skipped_transformer.ts" per service name patterns (tested: "skipped_transformer").",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///@whook/whook/transformers/skipped_transformer.ts",
         ],
         [
           "debug",
           "⚠️ - Skipping declaration (type: "schema", name: "Body", kept: "file:///__project__/transformers/transformNotSkipped.ts", skipped: "file:///@whook/whook/transformers/skipped_transformer.ts") per pluggins ordering.",
         ],
       ],
     }
    `);
  });
});
