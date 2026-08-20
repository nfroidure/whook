import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initCreateSecretKey from './createSecretKey.js';
import { type RandomBytesService, type LogService } from 'common-services';

describe('createSecretKey', () => {
  const log = jest.fn<LogService>();
  const randomBytes = jest.fn<RandomBytesService>();

  beforeEach(() => {
    log.mockReset();
    randomBytes.mockReset();
  });

  test('should work', async () => {
    // Have to use Object.assign for some reason here
    // See : https://stackoverflow.com/questions/56349619/ts2352-declare-object-with-dynamic-properties-and-one-property-with-specific-t
    const createSecretKey = await initCreateSecretKey({
      log,
      randomBytes,
    });

    randomBytes.mockResolvedValueOnce(Buffer.from('770eb5210f4cf68f', 'hex'));

    const result = await createSecretKey({
      command: 'whook',
      namedArguments: {
        name: 'MY_SECRET',
        size: 8,
        output: 'env',
      },
      rest: ['printEnv'],
    });

    expect({
      result,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "warning",
           "✔️ - Created a secret key (MY_SECRET)",
         ],
         [
           "info",
           "MY_SECRET=770eb5210f4cf68f",
         ],
       ],
       "result": undefined,
     }
    `);
  });
});
