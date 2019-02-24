import initGetDelay from './getDelay';

describe('getDelay', () => {
  const delay = {
    create: jest.fn(),
  };

  beforeEach(() => {
    delay.create.mockReset();
  });

  it('should work', async () => {
    delay.create.mockResolvedValueOnce();
    const getDelay = await initGetDelay(
      {
        delay,
      },
      { duration: 1000 },
    );
    const response = await getDelay();

    expect({
      response,
      delayCreateCalls: delay.create.mock.calls,
    }).toMatchSnapshot();
  });
});
