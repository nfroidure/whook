import initPrintEnvCommand from './printEnv';
import type { WhookCommandArgs } from '@whook/cli';

describe('printEnvCommand', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    // Have to use Object.assign for some reason here
    // See : https://stackoverflow.com/questions/56349619/ts2352-declare-object-with-dynamic-properties-and-one-property-with-specific-t
    const printEnvCommand = await initPrintEnvCommand({
      log,
      ENV: { NODE_ENV: 'test' },
      args: (Object.assign(
        {
          keysOnly: true,
        },
        {
          _: ['env'],
        },
      ) as unknown) as WhookCommandArgs,
    });
    const result = await printEnvCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
