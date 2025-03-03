import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPrintEnvCommand from './printEnv.js';
import { NodeEnv } from 'application-services';
import { type LogService } from 'common-services';

describe('printEnvCommand', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    // Have to use Object.assign for some reason here
    // See : https://stackoverflow.com/questions/56349619/ts2352-declare-object-with-dynamic-properties-and-one-property-with-specific-t
    const printEnvCommand = await initPrintEnvCommand({
      log,
      ENV: { NODE_ENV: NodeEnv.Test },
    });
    const result = await printEnvCommand({
      command: 'whook',
      namedArguments: {
        keysOnly: true,
      },
      rest: ['printEnv'],
    });

    expect({
      result,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
