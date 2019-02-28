import initMechanisms, { FAKE_MECHANISM } from './MECHANISMS';
import { BEARER as BEARER_MECHANISM } from 'http-auth-utils';

describe('NECHANISMS', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should only include bearer', async () => {
    const MECHANISMS = await initMechanisms({
      NODE_ENV: 'production',
      DEBUG_NODE_ENVS: ['test', 'development'],
      log,
    });

    expect(MECHANISMS).toEqual([BEARER_MECHANISM]);

    expect({
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should also include fake on debugging', async () => {
    const MECHANISMS = await initMechanisms({
      NODE_ENV: 'development',
      DEBUG_NODE_ENVS: ['test', 'development'],
      log,
    });

    expect(MECHANISMS).toEqual([BEARER_MECHANISM, FAKE_MECHANISM]);

    expect({
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });
});
