import { createRequire } from 'module';
import { join } from 'node:path';
import {
  describe,
  test,
  beforeAll,
  beforeEach,
  jest,
  expect,
} from '@jest/globals';
import initAPI from './API.js';
import initSecurityDefinitions from './SECURITY_DEFINITIONS.js';
import FULL_CONFIG from '../config/test/config.js';
import {
  WHOOK_DEFAULT_PLUGINS,
  WHOOK_PROJECT_PLUGIN_NAME,
  initDefinitions,
  initRoutesDefinitions,
  type WhookDefinitions,
  type WhookRoutesDefinitionsService,
  type WhookRouteDefinition,
  type WhookResolvedPluginsService,
  type WhookRouteModule,
  type WhookSecurityDefinitions,
} from '@whook/whook';
import { initImporter, type LogService } from 'common-services';
import { pathItemToOperationMap } from 'ya-open-api-types';
import { wrapDefinitionsWithCORS } from '@whook/cors';

describe('API', () => {
  const { CONFIG } = FULL_CONFIG;
  const BASE_URL = 'http://localhost:1337';
  const APP_ENV = 'test';
  const ENV = {};
  // TODO: Use import.meta.resolve when Jest will support it
  // See https://github.com/jestjs/jest/issues/14923
  const require = createRequire(
    join(process.cwd(), 'src', 'services', 'API.test.ts'),
  );
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PROJECT_PLUGIN_NAME]: {
      mainURL: new URL('..', import.meta.url).toString(),
      types: ['routes'],
    },
    '@whook/whook': {
      mainURL: 'file://' + require.resolve('@whook/whook'),
      types: ['routes'],
    },
  };
  const log = jest.fn<LogService>();
  let ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  let SECURITY_DEFINITIONS: WhookSecurityDefinitions;
  let DEFINITIONS: WhookDefinitions;

  beforeAll(async () => {
    const importer = await initImporter<WhookRouteModule>({ log });

    SECURITY_DEFINITIONS = await initSecurityDefinitions({ ENV, log });
    ROUTES_DEFINITIONS = await initRoutesDefinitions({
      APP_ENV,
      WHOOK_PLUGINS: WHOOK_DEFAULT_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      importer,
    });
    DEFINITIONS = await wrapDefinitionsWithCORS(initDefinitions)({
      WHOOK_PLUGINS: WHOOK_DEFAULT_PLUGINS,
      ROUTES_DEFINITIONS,
      COMMANDS_DEFINITIONS: {},
      CRONS_DEFINITIONS: {},
      CONSUMERS_DEFINITIONS: {},
      TRANSFORMERS_DEFINITIONS: {},
      SECURITY_DEFINITIONS,
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
      DEFINITIONS,
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
      DEFINITIONS,
      log,
    });
    const securitySchemes = API.components?.securitySchemes || {};
    const definitions: WhookRouteDefinition[] = [];

    for (const [path, pathItem] of Object.entries(API.paths || {})) {
      for (const [method, operation] of Object.entries(
        pathItemToOperationMap(pathItem),
      )) {
        definitions.push({
          path,
          method,
          operation,
          config: operation['x-whook'] || { type: 'http' },
        } as WhookRouteDefinition);
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
  //     DEFINITIONS,
  //     log,
  //   });

  //   // Not pure function... so deep cloning the dirtiest way
  //   await SwaggerParser.validate(JSON.parse(JSON.stringify(API)));
  // });

  describe('should always have the same amount of', () => {
    let definitions: WhookRouteDefinition[];

    beforeAll(async () => {
      const API = await initAPI({
        ENV: {},
        CONFIG,
        BASE_URL,
        API_VERSION: '1.1.0',
        DEFINITIONS,
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
          } as WhookRouteDefinition);
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
