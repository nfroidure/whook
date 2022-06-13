import { jest } from '@jest/globals';
import { constant } from 'knifecycle';
import {
  runServer,
  prepareServer,
  prepareEnvironment as basePrepareEnvironment,
} from './index.js';
import { default as axios } from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Knifecycle } from 'knifecycle';
import type { JWTService } from 'jwt-service';
import type { AuthenticationData } from './services/authentication.js';
import type { Logger } from 'common-services';

const _packageJSON = JSON.parse(readFileSync('package.json').toString());

// This is necessary only for Jest support
// it will be removeable when Jest will be fully
// ESM compatible
process.env.PROJECT_SRC = join(process.cwd(), 'src');

describe('runServer', () => {
  const logger = {
    output: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const time = jest.fn();
  const exit = jest.fn();
  const PORT = 9999;
  const HOST = 'localhost';
  const BASE_PATH = '/v4';

  async function prepareEnvironment<T extends Knifecycle>($?: T): Promise<T> {
    $ = await basePrepareEnvironment($);

    $.register(constant('API_VERSION', _packageJSON.version));
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(
      constant('BASE_ENV', {
        DEV_MODE: '1',
        JWT_SECRET: 'oudelali',
      }),
    );
    $.register(constant('PORT', PORT));
    $.register(constant('HOST', HOST));
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(constant('NODE_ENVS', ['test']));
    $.register(constant('exit', exit));
    $.register(constant('time', time));
    $.register(constant('logger', logger as Logger));

    return $;
  }
  process.env.ISOLATED_ENV = '1';

  let $instance: Knifecycle;
  let jwtToken: JWTService<AuthenticationData>;

  beforeAll(async () => {
    const { $instance: _instance, jwtToken: _jwtToken } = await runServer(
      prepareEnvironment,
      prepareServer,
      ['$instance', 'httpServer', 'process', 'jwtToken'],
    );

    $instance = _instance;
    jwtToken = _jwtToken;
  }, 5000);

  afterAll(async () => {
    await $instance.destroy();
  }, 1000);

  afterEach(() => {
    time.mockReset();
    logger.debug.mockReset();
    logger.output.mockReset();
    logger.error.mockReset();
  });

  it('should work', async () => {
    expect({
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logInfoCalls: logger.output.mock.calls
        .map(removeIps)
        .map(filterPaths)
        .sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchSnapshot();
  });

  it('should ping', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: { 'user-agent': '__avoid_axios_version__' },
      validateStatus: () => true,
    });

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
      },
      data,
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logInfoCalls: logger.output.mock.calls
        .map(removeIps)
        .map(filterPaths)
        .sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchSnapshot();
  });

  it('should authenticate users', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/diag`,
      headers: {
        authorization: `Bearer ${
          (
            await jwtToken.sign({
              scope: 'admin',
              userId: '1',
              applicationId: '1',
            })
          ).token
        }`,
        'user-agent': '__avoid_axios_version__',
      },
      validateStatus: () => true,
    });

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
      },
      data,
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logInfoCalls: logger.output.mock.calls
        .map(removeIps)
        .map(filterPaths)
        .sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchSnapshot();
  });

  it('should fail with bad fake tokens', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/diag`,
      headers: {
        authorization: `Fake e-admin`,
        'user-agent': '__avoid_axios_version__',
      },
      validateStatus: () => true,
    });

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
      },
      data,
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logInfoCalls: logger.output.mock.calls
        .map(removeIps)
        .map(filterPaths)
        .filter(([arg1]) => arg1 !== 'ERROR')
        .sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchSnapshot();
  });
});

function sortLogs(strs1, strs2) {
  return strs1[0] > strs2[0] ? 1 : strs1[0] === strs2[0] ? 0 : -1;
}

function filterPaths(strs) {
  return strs.map((str) =>
    'string' !== typeof str
      ? str
      : str
          .replace(
            /("|'| |^)(\/[^/]+){1,}\/whook\//g,
            '$1/home/whoiam/projects/whook/',
          )
          .replace(/(node:internal(?:\/\w+){1,}):\d+:\d+/g, '$1:x:x'),
  );
}

function removeIps(strs) {
  return strs.map((str) =>
    (str as string).replace(/(127\.0\.0\.1|::1)/gm, '_ip_'),
  );
}
