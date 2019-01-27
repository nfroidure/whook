import initHOST from './HOST';

describe('initHOST', () => {
  const log = jest.fn();
  const internalIp = { v4: jest.fn() };

  beforeEach(() => {
    log.mockReset();
    internalIp.v4.mockReset();
  });

  it('should use the env HOST first', async () => {
    const HOST = await initHOST({
      ENV: { HOST: '192.168.1.11' },
      log,
      internalIp,
    });

    expect({
      HOST,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      internalIpV4Calls: internalIp.v4.mock.calls,
    }).toMatchSnapshot();
  });

  it('should find a HOST by itself if no env HOST', async () => {
    internalIp.v4.mockResolvedValueOnce('192.168.1.10');

    const HOST = await initHOST({
      ENV: {},
      log,
      internalIp,
    });

    expect(HOST);
    expect({
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      internalIpV4Calls: internalIp.v4.mock.calls,
    }).toMatchSnapshot();
  });

  it('should fallback to localhost', async () => {
    internalIp.v4.mockResolvedValueOnce('');

    const HOST = await initHOST({
      ENV: {},
      log,
      internalIp,
    });

    expect(HOST);
    expect({
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      internalIpV4Calls: internalIp.v4.mock.calls,
    }).toMatchSnapshot();
  });
});
