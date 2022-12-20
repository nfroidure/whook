import { describe, it, expect } from '@jest/globals';
import initGetParameters from './getParameters.js';

describe('getParameters', () => {
  it('should work', async () => {
    const getParameters = await initGetParameters({});
    const response = await getParameters({
      pathParam1: 2,
      pathParam2: 'a',
      queryParam: ['a', 'b'],
      aHeader: true,
      aMultiHeader: [1, 2],
    });

    expect({
      response,
    }).toMatchInlineSnapshot(`
      {
        "response": {
          "body": {
            "aHeader": true,
            "aMultiHeader": [
              1,
              2,
            ],
            "pathParam1": 2,
            "pathParam2": "a",
            "queryParam": [
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
