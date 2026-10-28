import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initWrappersDeclarations, {
  type WhookHandlerWrapperDefinitionFilter,
} from './WRAPPERS_DECLARATIONS.js';
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
      mainURL: `file:///${WHOOK_PLUGINS[1]}/src`,
      types: ['routes', 'wrappers'],
    },
  };
  const log = jest.fn<LogService>();
  const importer =
    jest.fn<ImporterService<WhookHandlerWrapperModule<unknown>>>();
  const definition: WhookHandlerWrapperModule<unknown>['definition'] = {
    name: 'wrapExample',
    type: 'route',
    config: { targets: 'all' },
  };
  const wrapperModule: WhookHandlerWrapperModule<unknown> = {
    default: (() =>
      undefined) as unknown as WhookHandlerWrapperModule<unknown>['default'],
    definition,
  };
  const schema = { name: 'Example', schema: { type: 'string' as const } };
  const createDirectoryFilesWalker = jest.fn(
    async function* (baseURL: URL) {
      yield new URL('wrappers/wrapExample.ts', baseURL);
    },
  );
  const dependencies = {
    APP_ENV,
    WHOOK_PLUGINS,
    WHOOK_RESOLVED_PLUGINS,
    importer,
    createDirectoryFilesWalker,
    log,
  };

  beforeEach(() => {
    log.mockReset();
    importer.mockReset().mockResolvedValue(wrapperModule);
    createDirectoryFilesWalker.mockReset().mockImplementation(
      async function* (baseURL: URL) {
        yield new URL('wrappers/wrapExample.ts', baseURL);
      },
    );
  });
  test('should work', async () => {
    importer.mockImplementation(() =>
      Promise.resolve({
        default: (() =>
          undefined) as unknown as WhookHandlerWrapperModule<unknown>['default'],
        definition: {
          name: 'wrapNotSkipped',
          type: 'route',
          config: {
            environments: [APP_ENV],
            targets: 'none',
          },
        },
      }),
    );

    async function* createDirectoryFilesWalker(baseURL: URL) {
      yield new URL('wrappers/skipped_file.test.ts', baseURL);
      if (baseURL.pathname.includes(WHOOK_PLUGINS[1])) {
        yield new URL('wrappers/skipped_wrapper.ts', baseURL);
      } else {
        yield new URL('wrappers/wrapNotSkipped.ts', baseURL);
      }
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
         "schemas": {},
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
           "file:///__project__/wrappers/wrapNotSkipped.ts",
         ],
         [
           "file:///@whook/whook/wrappers/skipped_wrapper.ts",
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
           "⚠️ - Picking a new declaration in plugin "__project__" (type: "wrapper", name: "wrapNotSkipped".",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///@whook/whook/wrappers/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped wrapper from "file:///@whook/whook/wrappers/skipped_wrapper.ts" per service name patterns (tested: "skipped_wrapper").",
         ],
       ],
     }
    `);
  });

  test('should use the default plugins and optional logger', async () => {
    const declarations = await initWrappersDeclarations({
      APP_ENV,
      WHOOK_RESOLVED_PLUGINS,
      importer,
      createDirectoryFilesWalker,
    });

    expect(declarations).toEqual({
      wrappers: {
        wrapExample: {
          url: 'file:///__project__/wrappers/wrapExample.ts',
          name: 'wrapExample',
          pluginName: WHOOK_PLUGINS[0],
          type: 'wrapper',
          content: definition,
        },
      },
      schemas: {},
    });
    expect(createDirectoryFilesWalker).toHaveBeenCalledTimes(2);
    expect(log).not.toHaveBeenCalled();
  });

  test('should return empty declarations with no plugins', async () => {
    await expect(
      initWrappersDeclarations({ ...dependencies, WHOOK_PLUGINS: [] }),
    ).resolves.toEqual({ wrappers: {}, schemas: {} });
    expect(createDirectoryFilesWalker).not.toHaveBeenCalled();
    expect(importer).not.toHaveBeenCalled();
  });

  test('should skip plugins without wrappers', async () => {
    await expect(
      initWrappersDeclarations({
        ...dependencies,
        WHOOK_RESOLVED_PLUGINS: Object.fromEntries(
          WHOOK_PLUGINS.map((pluginName) => [
            pluginName,
            { ...WHOOK_RESOLVED_PLUGINS[pluginName], types: ['routes'] },
          ]),
        ),
      }),
    ).resolves.toEqual({ wrappers: {}, schemas: {} });
    expect(createDirectoryFilesWalker).not.toHaveBeenCalled();
    expect(importer).not.toHaveBeenCalled();
  });

  test('should handle empty wrapper directories', async () => {
    createDirectoryFilesWalker.mockImplementation(async function* () {
      yield* [];
    });

    await expect(initWrappersDeclarations(dependencies)).resolves.toEqual({
      wrappers: {},
      schemas: {},
    });
    expect(importer).not.toHaveBeenCalled();
  });

  test('should honor custom file name and ignore patterns', async () => {
    createDirectoryFilesWalker.mockImplementation(async function* (baseURL) {
      yield new URL('wrappers/wrapIgnored.custom', baseURL);
      yield new URL('wrappers/wrapExample.custom', baseURL);
    });

    const declarations = await initWrappersDeclarations({
      ...dependencies,
      DECLARATIONS_OPTIONS: {
        ignoredFilePatterns: ['Ignored'],
        fileNamePatterns: ['^(.*)\\.custom$'],
      },
    });

    expect(Object.keys(declarations.wrappers)).toEqual(['wrapExample']);
    expect(declarations.wrappers.wrapExample.url).toBe(
      'file:///__project__/wrappers/wrapExample.custom',
    );
    expect(importer).toHaveBeenCalledTimes(2);
    expect(importer.mock.calls.every(([url]) => !url.includes('Ignored'))).toBe(
      true,
    );
  });

  test.each(['wrapExample.txt', 'invalid.ts'])(
    'should collect schemas without registering a wrapper from %s',
    async (file) => {
      createDirectoryFilesWalker.mockImplementation(async function* (baseURL) {
        yield new URL(`wrappers/${file}`, baseURL);
      });
      importer.mockResolvedValue({ ...wrapperModule, exampleSchema: schema });

      const declarations = await initWrappersDeclarations(dependencies);

      expect(declarations.wrappers).toEqual({});
      expect(declarations.schemas).toEqual({
        Example: {
          url: `file:///__project__/wrappers/${file}`,
          name: 'Example',
          pluginName: WHOOK_PLUGINS[0],
          type: 'schema',
          content: schema,
        },
      });
    },
  );

  test.each(['default', 'definition'] as const)(
    'should skip wrappers without a %s export but collect their schemas',
    async (missingExport) => {
      const module = { ...wrapperModule, exampleSchema: schema };
      Reflect.deleteProperty(module, missingExport);
      importer.mockResolvedValue(module);

      const declarations = await initWrappersDeclarations(dependencies);

      expect(declarations.wrappers).toEqual({});
      expect(declarations.schemas.Example.content).toEqual(schema);
    },
  );

  test.each([
    { environments: undefined, registered: true },
    { environments: 'all' as const, registered: true },
    { environments: [APP_ENV], registered: true },
    { environments: [], registered: false },
  ])(
    'should register=$registered with environments=$environments',
    async ({ environments, registered }) => {
      importer.mockResolvedValue({
        ...wrapperModule,
        definition: {
          ...definition,
          config: { targets: 'all', environments },
        },
        exampleSchema: schema,
      });

      const declarations = await initWrappersDeclarations(dependencies);

      expect(Object.keys(declarations.wrappers)).toEqual(
        registered ? ['wrapExample'] : [],
      );
      expect(declarations.schemas.Example.content).toEqual(schema);
    },
  );

  test('should accept wrappers without config', async () => {
    const definitionWithoutConfig = { ...definition };
    delete definitionWithoutConfig.config;
    importer.mockResolvedValue({
      ...wrapperModule,
      definition: definitionWithoutConfig,
    });

    const declarations = await initWrappersDeclarations(dependencies);

    expect(declarations.wrappers.wrapExample.content).toEqual(
      definitionWithoutConfig,
    );
  });

  test.each([true, false])(
    'should honor a custom filter returning %s and still collect schemas',
    async (filtered) => {
      const WRAPPER_DEFINITION_FILTER =
        jest.fn<WhookHandlerWrapperDefinitionFilter>(() => filtered);
      importer.mockResolvedValue({ ...wrapperModule, exampleSchema: schema });

      const declarations = await initWrappersDeclarations({
        ...dependencies,
        WRAPPER_DEFINITION_FILTER,
      });

      expect(WRAPPER_DEFINITION_FILTER).toHaveBeenCalledWith(definition);
      expect(Object.keys(declarations.wrappers)).toEqual(
        filtered ? [] : ['wrapExample'],
      );
      expect(declarations.schemas.Example.content).toEqual(schema);
    },
  );

  test.each([WHOOK_PLUGINS, [...WHOOK_PLUGINS].reverse()])(
    'should keep wrappers and schemas from the first plugin in %j',
    async (...plugins) => {
      importer.mockImplementation(async (url) => ({
        ...wrapperModule,
        definition: { ...definition, summary: url },
        exampleSchema: {
          ...schema,
          schema: { ...schema.schema, description: url },
        },
      }));

      const declarations = await initWrappersDeclarations({
        ...dependencies,
        WHOOK_PLUGINS: plugins,
      });

      expect(declarations.wrappers.wrapExample.pluginName).toBe(plugins[0]);
      expect(declarations.schemas.Example.pluginName).toBe(plugins[0]);
      expect(declarations.wrappers.wrapExample.content.summary).toBe(
        importer.mock.calls[0][0],
      );
      expect(declarations.schemas.Example.content).toEqual({
        ...schema,
        schema: {
          ...schema.schema,
          description: importer.mock.calls[0][0],
        },
      });
    },
  );

  test.each([true, false])(
    'should keep the first same-plugin duplicate with identical content=%s',
    async (identicalContent) => {
      createDirectoryFilesWalker.mockImplementation(async function* (baseURL) {
        yield new URL('wrappers/first/wrapExample.ts', baseURL);
        yield new URL('wrappers/second/wrapExample.ts', baseURL);
      });
      importer.mockImplementation(async (url) => ({
        ...wrapperModule,
        definition: identicalContent
          ? definition
          : { ...definition, summary: url },
        exampleSchema: identicalContent
          ? schema
          : { ...schema, schema: { ...schema.schema, description: url } },
      }));

      const declarations = await initWrappersDeclarations({
        ...dependencies,
        WHOOK_PLUGINS: [WHOOK_PLUGINS[0]],
      });

      expect(declarations.wrappers.wrapExample.url).toBe(
        'file:///__project__/wrappers/first/wrapExample.ts',
      );
      expect(declarations.schemas.Example.url).toBe(
        declarations.wrappers.wrapExample.url,
      );
      expect(importer).toHaveBeenCalledTimes(2);
    },
  );

  test('should log and rethrow import errors without loading further files', async () => {
    const error = new Error('Import failed');
    importer.mockRejectedValue(error);

    await expect(initWrappersDeclarations(dependencies)).rejects.toBe(error);
    expect(importer).toHaveBeenCalledTimes(1);
    expect(log.mock.calls).toContainEqual([
      'error',
      expect.stringContaining('wrapExample.ts'),
    ]);
    expect(log.mock.calls).toContainEqual([
      'error-stack',
      expect.stringContaining('Import failed'),
    ]);
  });

  test('should log and rethrow definition filter errors', async () => {
    const error = new Error('Filter failed');

    await expect(
      initWrappersDeclarations({
        ...dependencies,
        WRAPPER_DEFINITION_FILTER: () => {
          throw error;
        },
      }),
    ).rejects.toBe(error);
    expect(log.mock.calls).toContainEqual([
      'error-stack',
      expect.stringContaining('Filter failed'),
    ]);
  });

  test('should propagate directory walker errors', async () => {
    const error = new Error('Directory failed');
    createDirectoryFilesWalker.mockImplementation(async function* () {
      yield await Promise.reject(error);
    });

    await expect(initWrappersDeclarations(dependencies)).rejects.toBe(error);
    expect(importer).not.toHaveBeenCalled();
  });
});
