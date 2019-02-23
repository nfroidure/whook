import initGetTime from './getTime';

describe('getTime', () => {
  const time = jest.fn();

  it('should work', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00Z').getTime());

    const getTime = await initGetTime({
      time,
    });
    const response = await getTime();

    expect({
      response,
    }).toMatchSnapshot();
  });
});
