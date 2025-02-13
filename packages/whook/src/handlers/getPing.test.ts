import { describe, test, expect } from '@jest/globals';
import initGetPing from './getPing.js';
import { NodeEnv } from 'application-services';

describe('getPing', () => {
  test('should work', async () => {
    const getPing = await initGetPing({
      ENV: { NODE_ENV: NodeEnv.Test },
    });
    const response = await getPing();

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
