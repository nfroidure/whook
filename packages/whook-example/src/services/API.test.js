import initAPI from './API';
import FULL_CONFIG from '../config/test/config';
import {
  flattenOpenAPI,
  getOpenAPIOperations,
} from '@whook/http-router/dist/utils';
import OpenAPISchemaValidator from 'openapi-schema-validator';

describe('API', () => {
  const { CONFIG, NODE_ENV, DEBUG_NODE_ENVS } = FULL_CONFIG;
  const HOST = 'localhost';
  const PORT = '1337';
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const API = await initAPI({
      log,
      CONFIG,
      HOST,
      PORT,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      API_VERSION: '1.1.0',
    });

    expect({
      API,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should always use declared security definition', async () => {
    const API = await initAPI({
      log,
      CONFIG,
      HOST,
      PORT,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      API_VERSION: '1.1.0',
    });
    const securitySchemes = API.components.securitySchemes;
    const operations = await getOpenAPIOperations(API);

    expect(
      operations
        .filter(operation => operation.security && operation.security.length)
        .filter(operation =>
          operation.security.some(operationSecurity =>
            Object.keys(operationSecurity).some(
              operationSecurityName => !securitySchemes[operationSecurityName],
            ),
          ),
        )
        .map(({ method, path }) => `${method} ${path}`)
        .sort(),
    ).toEqual([]);
  });

  it('should produce a valid OpenAPI file', async () => {
    const API = await initAPI({
      log,
      CONFIG,
      HOST,
      PORT,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      API_VERSION: '1.1.0',
    });

    const result = new OpenAPISchemaValidator({ version: 3 }).validate(API);

    expect({ result }).toMatchSnapshot();
  });

  describe('should always have the same amount of', () => {
    let operations;

    beforeAll(async () => {
      const API = await initAPI({
        log,
        CONFIG,
        HOST,
        PORT,
        NODE_ENV,
        DEBUG_NODE_ENVS,
        API_VERSION: '1.1.0',
      });

      operations = await getOpenAPIOperations(await flattenOpenAPI(API));
    });

    it('endpoints', async () => {
      expect(
        operations
          .filter(
            operation => !operation['x-whook'] || !operation['x-whook'].private,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('publicly documented endpoints', async () => {
      expect(
        operations
          .filter(
            operation => !operation['x-whook'] || !operation['x-whook'].private,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('non authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            operation => !operation.security || operation.security.length === 0,
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('basic authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            operation =>
              operation.security &&
              operation.security.some(security => security.basicAuth),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });

    it('bearer authenticated endpoints', async () => {
      expect(
        operations
          .filter(
            operation =>
              operation.security &&
              operation.security.some(security => security.bearerAuth),
          )
          .map(({ method, path }) => `${method} ${path}`)
          .sort(),
      ).toMatchSnapshot();
    });
  });
});
