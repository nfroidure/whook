import initGetDelay from './getDelay';

describe('getDelay', () => {
  const delay = {
    create: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(() => {
    delay.create.mockReset();
  });

  it('should work', async () => {
    delay.create.mockResolvedValueOnce(undefined);
    const getDelay = await initGetDelay({
      delay,
    });
    const response = await getDelay({
      duration: 1000,
    });

    expect({
      response,
      delayCreateCalls: delay.create.mock.calls,
      delayClearCalls: delay.clear.mock.calls,
    }).toMatchSnapshot();
  });
});
