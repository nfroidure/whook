import {
  describe,
  test,
  beforeAll,
  beforeEach,
  jest,
  expect,
} from '@jest/globals';
import initAPI from './API.js';
import FULL_CONFIG from '../config/test/config.js';
import { createRequire } from 'module';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  WHOOK_DEFAULT_PLUGINS,
  initAPIDefinitions,
  type WhookAPIHandlerModule,
  type WhookAPIHandlerDefinition,
} from '@whook/whook';
import { initImporter } from 'common-services';
import { join } from 'node:path';
import { type LogService } from 'common-services';
import { pathItemToOperationMap } from 'ya-open-api-types';

describe('API', () => {
  // TODO: Use import.meta.resolve when Jest will support it
  // See https://github.com/jestjs/jest/issues/14923
  const require = createRequire(
    join(process.cwd(), 'src', 'services', 'API.test.ts'),
  );

  const { CONFIG } = FULL_CONFIG;
  const BASE_URL = 'http://localhost:1337';
  const log = jest.fn<LogService>();
  let API_DEFINITIONS;

  beforeAll(async () => {
    const importer = await initImporter<WhookAPIHandlerModule>({ log });

    API_DEFINITIONS = await initAPIDefinitions({
      APP_ENV: 'test',
      WHOOK_PLUGINS: WHOOK_DEFAULT_PLUGINS,
      WHOOK_RESOLVED_PLUGINS: {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: new URL('..', import.meta.url).toString(),
          types: ['handlers'],
        },
        '@whook/whook': {
          mainURL: 'file://' + require.resolve('@whook/whook'),
          types: ['handlers'],
        },
      },
      importer,
    });
  });

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    const API = await initAPI({
      ENV: {},
      CONFIG,
      BASE_URL,
      API_VERSION: '1.1.0',
      API_DEFINITIONS,
      log,
    });

    expect({
      API,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  test('should always use declared security definition', async () => {
    const API = await initAPI({
      ENV: {},
      CONFIG,
      BASE_URL,
      API_VERSION: '1.1.0',
      API_DEFINITIONS,
      log,
    });
    const securitySchemes = API.components?.securitySchemes || {};
    const definitions: WhookAPIHandlerDefinition[] = [];

    for (const [path, pathItem] of Object.entries(API.paths || {})) {
      for (const [method, operation] of Object.entries(
        pathItemToOperationMap(pathItem),
      )) {
        definitions.push({
          path,
          method,
          operation,
          config: operation['x-whook'] || { type: 'http' },
        } as WhookAPIHandlerDefinition);
      }
    }

    expect(
      definitions
        .filter(
          ({ operation }) => operation.security && operation.security.length,
        )
        .filter(({ operation }) =>
          (operation.security || []).some((operationSecurity) =>
            Object.keys(operationSecurity).some(
              (operationSecurityName) =>
                !securitySchemes[operationSecurityName],
            ),
          ),
        )
        .map(({ method, path }) => `${method} ${path}`)
        .sort(),
    ).toEqual([]);
  });

  // test('should produce a valid OpenAPI file', async () => {
  //   const API = await initAPI({
  //     ENV: {},
  //     CONFIG,
  //     BASE_URL,
  //     API_VERSION: '1.1.0',
  //     API_DEFINITIONS,
  //     log,
  //   });

  //   // Not pure function... so deep cloning the dirtiest way
  //   await SwaggerParser.validate(JSON.parse(JSON.stringify(API)));
  // });

  describe('should always have the same amount of', () => {
    let definitions: WhookAPIHandlerDefinition[];

    beforeAll(async () => {
      const API = await initAPI({
        ENV: {},
        CONFIG,
        BASE_URL,
        API_VERSION: '1.1.0',
        API_DEFINITIONS,
        log,
      });

      definitions = [];

      for (const [path, pathItem] of Object.entries(API.paths || {})) {
        for (const [method, operation] of Object.entries(
          pathItemToOperationMap(pathItem),
        )) {
          definitions.push({
            path,
            method,
            operation,
            config: operation['x-whook'] || { type: 'http' },
          } as WhookAPIHandlerDefinition);
        }
      }
    });

    test('endpoints', async () => {
      expect(
        definitions
          .filter(
            (operation) =>
              !operation['x-whook'] || !operation['x-whook'].private,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    test('publicly documented endpoints', async () => {
      expect(
        definitions
          .filter(
            (operation) =>
              !operation['x-whook'] || !operation['x-whook'].private,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    test('non authenticated endpoints', async () => {
      expect(
        definitions
          .filter(
            ({ operation }) =>
              !operation.security || operation.security.length === 0,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    test('optionally authenticated endpoints', async () => {
      expect(
        definitions
          .filter(
            ({ operation }) =>
              operation.security &&
              operation.security.some(
                (security) => Object.keys(security).length === 0,
              ),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    test('basic authenticated endpoints', async () => {
      expect(
        definitions
          .filter(
            ({ operation }) =>
              operation.security &&
              operation.security.some((security) => security.basicAuth),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    test('bearer authenticated endpoints', async () => {
      expect(
        definitions
          .filter(
            ({ operation }) =>
              operation.security &&
              operation.security.some((security) => security.bearerAuth),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });
  });
});
