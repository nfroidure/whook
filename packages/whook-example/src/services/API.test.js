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

  it('should always have the same amount of public endpoints', async () => {
    const API = await initAPI({
      log,
      CONFIG,
      HOST,
      PORT,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      API_VERSION: '1.1.0',
    });
    const operations = await getOpenAPIOperations(await flattenOpenAPI(API));

    expect(
      operations
        .filter(
          operation => !operation['x-whook'] || !operation['x-whook'].private,
        )
        .map(({ method, path }) => `${method} ${path}`)
        .sort(),
    ).toMatchSnapshot();
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
});