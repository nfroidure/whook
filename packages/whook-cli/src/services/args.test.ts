import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initArgs from './args.js';
import type { LogService } from 'common-services';

describe('initArgs', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  it('should parse args', async () => {
    const args = await initArgs({
      log,
      ARGS: ['whook', 'handler', '--name', 'getPing', '--parameters', '{}'],
    });

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      args,
    }).toMatchSnapshot();
  });
});
