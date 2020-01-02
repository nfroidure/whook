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
      timeCalls: time.mock.calls,
      response,
    }).toMatchSnapshot();
  });
});
