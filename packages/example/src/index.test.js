import packageConf from '../../../package';
import { constant } from 'knifecycle';
import {
  runServer,
  prepareServer,
  prepareEnvironment as basePrepareEnvironment,
} from './index';
import axios from 'axios';
import YError from 'yerror';

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

  async function prepareEnvironment() {
    const $ = await basePrepareEnvironment();

    $.register(constant('API_VERSION', packageConf.version));
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('ENV', {}));
    $.register(constant('PORT', PORT));
    $.register(constant('HOST', HOST));
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('DEBUG_NODE_ENVS', ['test']));
    $.register(constant('NODE_ENVS', ['test']));
    $.register(constant('exit', exit));
    $.register(constant('time', time));
    $.register(constant('logger', logger));
    $.register(constant('debug', debug));

    return $;
  }
  process.env.ISOLATED_ENV = 1;

  let $destroy;

  beforeAll(async () => {
    const { $destroy: _destroy } = await runServer(
      prepareEnvironment,
      prepareServer,
      ['$destroy', 'httpServer', 'process'],
    );

    $destroy = _destroy;
  }, 5000);

  afterAll(async () => {
    await $destroy();
  }, 1000);

  afterEach(() => {
    time.mockReset();
    debug.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
  });

  it('should work', async () => {
    expect({
      debugCalls: debug.mock.calls.map(filterPaths),
      logInfoCalls: logger.info.mock.calls.map(filterPaths),
      logErrorCalls: logger.error.mock.calls.map(filterPaths),
    }).toMatchSnapshot();
  });

  it('should ping', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
    });

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: {}.undef,
      },
      data,
      debugCalls: debug.mock.calls.map(filterPaths),
      logInfoCalls: logger.info.mock.calls.map(filterPaths),
      logErrorCalls: logger.error.mock.calls.map(filterPaths),
    }).toMatchSnapshot();
  });

  it('should authenticate users', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/diag`,
      headers: {
        authorization: `Fake 1-admin`,
      },
    });

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: {}.undef,
      },
      data,
      debugCalls: debug.mock.calls.map(filterPaths),
      logInfoCalls: logger.info.mock.calls.map(filterPaths),
      logErrorCalls: logger.error.mock.calls.map(filterPaths),
    }).toMatchSnapshot();
  });

  it('should fail with bad fake tokens', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    try {
      await axios({
        method: 'get',
        url: `http://${HOST}:${PORT}${BASE_PATH}/diag`,
        headers: {
          authorization: `Fake e-admin`,
        },
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      const { status, headers, data } = err.response;

      expect({
        status,
        headers: {
          ...headers,
          // Erasing the Date header that may be added by Axios :/
          date: {}.undef,
        },
        data,
        debugCalls: debug.mock.calls.map(filterPaths),
        logInfoCalls: logger.info.mock.calls.map(filterPaths),
        logErrorCalls: logger.error.mock.calls
          .map(filterPaths)
          .filter(([arg1]) => arg1 !== 'An error occured'),
      }).toMatchSnapshot();
    }
  });
});

function filterPaths(strs) {
  return strs.map(str =>
    'string' !== typeof str
      ? str
      : str.replace(/ (\/[^/]+){1,}\/whook/g, ' /home/whoiam/projects/whook'),
  );
}
