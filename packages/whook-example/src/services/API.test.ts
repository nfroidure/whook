import {
  describe,
  it,
  beforeAll,
  beforeEach,
  jest,
  expect,
} from '@jest/globals';
import initAPI from './API.js';
import FULL_CONFIG from '../config/test/config.js';
import { getOpenAPIOperations } from '@whook/http-router';
import { createRequire } from 'module';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  WHOOK_DEFAULT_PLUGINS,
  initAPIDefinitions,
} from '@whook/whook';
import { initImporter } from 'common-services';
import { join } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { LogService } from 'common-services';
import type { WhookAPIHandlerModule } from '@whook/whook';

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

  it('should work', async () => {
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

  it('should always use declared security definition', async () => {
    const API = await initAPI({
      ENV: {},
      CONFIG,
      BASE_URL,
      API_VERSION: '1.1.0',
      API_DEFINITIONS,
      log,
    });
    const securitySchemes = API.components?.securitySchemes || {};
    const operations = getOpenAPIOperations(API);

    expect(
      operations
        .filter((operation) => operation.security && operation.security.length)
        .filter((operation) =>
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

  it('should produce a valid OpenAPI file', async () => {
    const API = await initAPI({
      ENV: {},
      CONFIG,
      BASE_URL,
      API_VERSION: '1.1.0',
      API_DEFINITIONS,
      log,
    });

    await SwaggerParser.validate(API);
  });

  describe('should always have the same amount of', () => {
    let operations;

    beforeAll(async () => {
      const API = await initAPI({
        ENV: {},
        CONFIG,
        BASE_URL,
        API_VERSION: '1.1.0',
        API_DEFINITIONS,
        log,
      });

      operations = getOpenAPIOperations(API);
    });

    it('endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              !operation['x-whook'] || !operation['x-whook'].private,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('publicly documented endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              !operation['x-whook'] || !operation['x-whook'].private,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('non authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              !operation.security || operation.security.length === 0,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('optionally authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              operation.security &&
              operation.security.some(
                (security) => Object.keys(security).length === 0,
              ),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('basic authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              operation.security &&
              operation.security.some((security) => security.basicAuth),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('bearer authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            (operation) =>
              operation.security &&
              operation.security.some((security) => security.bearerAuth),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });
  });
});
