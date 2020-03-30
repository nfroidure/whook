import initGetTime from './getTime';
import { TimeService } from 'common-services';

describe('getTime', () => {
  const time = jest.fn() as TimeService & jest.Mock<number>;

  it('should work', async () => {
    time.mockReturnValue(Date.parse('2014-01-26T00:00:00Z'));

    const getTime = await initGetTime({
      time,
    });
    const response = await getTime();

    expect({
      response,
    }).toMatchInlineSnapshot(`
      Object {
        "response": Object {
          "body": Object {
            "time": 1390694400000,
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
