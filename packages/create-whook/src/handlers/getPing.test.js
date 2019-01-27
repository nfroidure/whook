import initGetPing from './getPing';

describe('getPing', () => {
  it('should work', async () => {
    const getPing = await initGetPing({
      NODE_ENV: 'test',
    });
    const response = await getPing();

    expect({
      response,
    }).toMatchSnapshot();
  });
});
