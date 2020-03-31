import _internalIp from 'internal-ip';
import initHOST from './HOST';

describe('initHOST', () => {
  const log = jest.fn();
  const _require = jest.fn();
  const internalIp = { v4: jest.fn() as jest.Mock & typeof _internalIp.v4 };

  beforeEach(() => {
    log.mockReset();
    _require.mockReset();
    internalIp.v4.mockReset();
  });

  it('should use the env HOST first', async () => {
    _require.mockReturnValueOnce(internalIp);
    const HOST = await initHOST({
      ENV: { HOST: '192.168.1.11' },
      log,
      require: _require as any,
    });

    expect(HOST).toMatchInlineSnapshot(`"192.168.1.11"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      requireCalls: _require.mock.calls,
      internalIpV4Calls: internalIp.v4.mock.calls,
    }).toMatchSnapshot();
  });

  it('should find a HOST by itself if no env HOST', async () => {
    _require.mockReturnValueOnce(internalIp);
    internalIp.v4.mockResolvedValueOnce('192.168.1.10');

    const HOST = await initHOST({
      ENV: {},
      log,
      require: _require as any,
    });

    expect(HOST).toMatchInlineSnapshot(`"192.168.1.10"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      requireCalls: _require.mock.calls,
      internalIpV4Calls: internalIp.v4.mock.calls,
    }).toMatchSnapshot();
  });

  it('should fallback to localhost', async () => {
    _require.mockReturnValueOnce(internalIp);
    internalIp.v4.mockResolvedValueOnce('');

    const HOST = await initHOST({
      ENV: {},
      log,
      require: _require as any,
    });

    expect(HOST).toMatchInlineSnapshot(`"localhost"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      requireCalls: _require.mock.calls,
      internalIpV4Calls: internalIp.v4.mock.calls,
    }).toMatchSnapshot();
  });
});
