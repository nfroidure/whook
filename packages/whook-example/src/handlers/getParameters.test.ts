import { describe, it, expect } from '@jest/globals';
import initGetParameters from './getParameters.js';

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
      {
        "response": {
          "body": {
            "aHeader": true,
            "pathParam1": 2,
            "pathParam2": [
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
