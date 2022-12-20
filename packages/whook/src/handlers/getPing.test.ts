import { describe, it, expect } from '@jest/globals';
import initGetPing from './getPing.js';

describe('getPing', () => {
  it('should work', async () => {
    const getPing = await initGetPing({
      NODE_ENV: 'test',
    });
    const response = await getPing({});

    expect({
      response,
    }).toMatchInlineSnapshot(`
      {
        "response": {
          "body": {
            "pong": "pong",
          },
          "headers": {
            "X-Node-ENV": "test",
          },
          "status": 200,
        },
      }
    `);
  });
});
