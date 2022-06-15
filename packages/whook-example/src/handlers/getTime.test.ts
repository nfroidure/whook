import { jest } from '@jest/globals';
import initGetTime from './getTime.js';
import type { TimeService } from 'common-services';

describe('getTime', () => {
  const time = jest.fn<TimeService>();

  it('should work', async () => {
    time.mockReturnValue(Date.parse('2014-01-26T00:00:00Z'));

    const getTime = await initGetTime({
      time,
    });
    const response = await getTime({});

    expect({
      response,
    }).toMatchInlineSnapshot(`
      Object {
        "response": Object {
          "body": Object {
            "currentDate": "2014-01-26T00:00:00.000Z",
          },
          "status": 200,
        },
      }
    `);
    expect({
      timeCalls: time.mock.calls,
    }).toMatchSnapshot();
  });
});
