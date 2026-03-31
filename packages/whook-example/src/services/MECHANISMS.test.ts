import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initMechanisms, { FAKE_MECHANISM } from './MECHANISMS.js';
import { BEARER as BEARER_MECHANISM } from 'http-auth-utils';
import { type LogService } from 'common-services';
import { NodeEnv } from 'application-services';

describe('MECHANISMS', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should only include bearer', async () => {
    const MECHANISMS = await initMechanisms({
      ENV: { NODE_ENV: NodeEnv.Test },
      log,
    });

    expect(MECHANISMS).toEqual([BEARER_MECHANISM]);

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  test('should also include fake on debugging', async () => {
    const MECHANISMS = await initMechanisms({
      ENV: { NODE_ENV: NodeEnv.Test, DEV_MODE: '1' },
      log,
    });

    expect(MECHANISMS).toEqual([BEARER_MECHANISM, FAKE_MECHANISM]);

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
