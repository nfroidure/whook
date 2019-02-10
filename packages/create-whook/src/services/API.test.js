import initAPI from './API';
import FULL_CONFIG from '../config/test/config';

describe('API', () => {
  const { CONFIG } = FULL_CONFIG;
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const API = await initAPI({
      log,
      CONFIG,
    });

    expect({
      API,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });
});
