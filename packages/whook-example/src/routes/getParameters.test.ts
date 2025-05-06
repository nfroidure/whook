import { describe, test, expect } from '@jest/globals';
import initGetParameters from './getParameters.js';

describe('getParameters', () => {
  test('should work', async () => {
    const getParameters = await initGetParameters({});

    const response = await getParameters({
      path: {
        pathParam1: 2,
        pathParam2: 'a',
      },
      query: {
        queryParam: ['a', 'b'],
      },
      headers: {
        'a-header': true,
        aMultiHeader: [1, 2],
      },
    });

    expect({
  response
}).toMatchInlineSnapshot(`
{
  "response": {
    "body": {
      "aHeader": true,
      "aMultiHeader": [
        1,
        1,
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
