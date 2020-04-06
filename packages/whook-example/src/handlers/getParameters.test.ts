import initGetParameters from './getParameters';

describe('getParameters', () => {
  it('should work', async () => {
    const getParameters = await initGetParameters({});
    const response = await getParameters({
      pathParam1: 2,
      pathParam2: ['a', 'b'],
      aHeader: true,
    });

    expect({
      response,
    }).toMatchInlineSnapshot(`
      Object {
        "response": Object {
          "body": Object {
            "aHeader": true,
            "pathParam1": 2,
            "pathParam2": Array [
              "a",
              "b",
            ],
          },
          "status": 200,
        },
      }
    `);
  });
});
