import initBaseURL from './BASE_URL';

describe('initBaseURL', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work with all dependencies', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {},
      PROTOCOL: 'https',
      HOST: 'localhost',
      PORT: '1337',
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with required dependencies only', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {},
      HOST: 'localhost',
      PORT: '1337',
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with a base URL in config', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {
        baseURL: 'https://example.com',
      },
      HOST: 'localhost',
      PORT: '1337',
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with a base URL in config but in development mode', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {
        DEV_MODE: 1,
      },
      CONFIG: {
        baseURL: 'https://example.com',
      },
      HOST: 'localhost',
      PORT: '1337',
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });
});
