import { constant } from 'knifecycle';
import {
  runServer,
  prepareServer,
  prepareEnvironment as basePrepareEnvironment,
} from './index';
import axios from 'axios';
import type { Knifecycle, Dependencies } from 'knifecycle';
import type { JWTService } from 'jwt-service';
import type { AuthenticationData } from './services/authentication';

// eslint-disable-next-line
const packageConf = require('../package');

describe('runServer', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };
  const debug = jest.fn();
  const time = jest.fn();
  const exit = jest.fn();
  const PORT = 9999;
  const HOST = 'localhost';
  const BASE_PATH = '/v4';

  async function prepareEnvironment<T extends Knifecycle<Dependencies>>(
    $?: T,
  ): Promise<T> {
    $ = await basePrepareEnvironment($);

    $.register(constant('API_VERSION', packageConf.version));
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
    $.register(constant('logger', logger));
    $.register(constant('debug', debug));

    return $;
  }
  process.env.ISOLATED_ENV = '1';

  let $instance: Knifecycle<Dependencies>;
  let jwtToken: JWTService<AuthenticationData>;

  beforeAll(async () => {
    const {
      $instance: _instance,
      jwtToken: _jwtToken,
    } = await runServer(prepareEnvironment, prepareServer, [
      '$instance',
      'httpServer',
      'process',
      'jwtToken',
    ]);

    $instance = _instance;
    jwtToken = _jwtToken;
  }, 5000);

  afterAll(async () => {
    await $instance.destroy();
  }, 1000);

  afterEach(() => {
    time.mockReset();
    debug.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
  });

  it('should work', async () => {
    expect({
      debugCalls: debug.mock.calls.map(filterPaths).sort(sortLogs),
      logInfoCalls: logger.info.mock.calls.map(filterPaths).sort(sortLogs),
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
      debugCalls: debug.mock.calls.map(filterPaths).sort(sortLogs),
      logInfoCalls: logger.info.mock.calls.map(filterPaths).sort(sortLogs),
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
      debugCalls: debug.mock.calls.map(filterPaths).sort(sortLogs),
      logInfoCalls: logger.info.mock.calls.map(filterPaths).sort(sortLogs),
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
      debugCalls: debug.mock.calls.map(filterPaths).sort(sortLogs),
      logInfoCalls: logger.info.mock.calls
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
      : str.replace(
          /('| |^)(\/[^/]+){1,}\/whook\//g,
          '$1/home/whoiam/projects/whook/',
        ),
  );
}
