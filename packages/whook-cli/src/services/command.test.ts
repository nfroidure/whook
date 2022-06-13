import { jest } from '@jest/globals';
import initCommand from './command.js';
import type { LogService } from 'common-services';

describe('command', () => {
  const log = jest.fn<LogService>();
  const commandHandler = () => log('info', 'commandHandler ran');

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const command = await initCommand({
      commandHandler,
      log,
    });

    command();

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
