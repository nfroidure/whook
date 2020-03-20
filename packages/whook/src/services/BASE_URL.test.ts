import initBaseURL from './BASE_URL';

describe('initBaseURL', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work with all dependencies', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {
        name: 'project',
      },
      PROTOCOL: 'https',
      HOST: 'localhost',
      PORT: 1337,
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with required dependencies only', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {
        name: 'project',
      },
      HOST: 'localhost',
      PORT: 1337,
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with a base URL in config', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {
        name: 'project',
        baseURL: 'https://example.com',
      },
      HOST: 'localhost',
      PORT: 1337,
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with a base URL in config but in development mode', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {
        DEV_MODE: '1',
      },
      CONFIG: {
        name: 'project',
        baseURL: 'https://example.com',
      },
      HOST: 'localhost',
      PORT: 1337,
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
