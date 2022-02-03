import initLog from './log';

describe('log service', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation();

  afterAll(() => spy.mockRestore());

  test('should just log into the console', async () => {
    const log = await initLog({});

    log('info', 'A test log !');

    expect(spy.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "info",
          "A test log !",
        ],
      ]
    `);
  });
});
