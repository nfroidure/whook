import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGenerateOpenAPISchema from './generateOpenAPISchema.js';
import { PassThrough } from 'node:stream';
import { type LogService } from 'common-services';

/* Architecture Note #4.1: Testing

In such a hard life, Whook's make it simple to
 also test your commands.
*/
describe('generateOpenAPISchema', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getOpenAPI = jest.fn<any>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    getOpenAPI.mockReset();
    log.mockReset();
  });

  test('should work', async () => {
    getOpenAPI.mockResolvedValueOnce({
      status: 200,
      body: {
        openapi: '3.1.0',
        info: {
          version: '0.0.0',
          title: 'api',
          description: 'The API',
        },
      },
    });

    const outstream = new PassThrough();
    const outputPromise = new Promise((resolve, reject) => {
      let buffer = Buffer.from('');
      outstream.on('data', (aBuffer) => {
        buffer = Buffer.concat([buffer, aBuffer]);
      });
      outstream.once('error', () => reject);
      outstream.once('end', () => resolve(buffer.toString()));
    });
    const generateOpenAPISchema = await initGenerateOpenAPISchema({
      log,
      getOpenAPI,
      outstream,
      args: {
        command: 'whook',
        namedArguments: {
          pretty: true,
        },
        rest: ['generateOpenAPISchema'],
      },
    });
    const result = await generateOpenAPISchema();

    expect({
      result,
      output: await outputPromise,
      getOpenAPICalls: getOpenAPI.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(
      {},
      `
{
  "getOpenAPICalls": [
    [
      {
        "options": {
          "authenticated": true,
        },
        "query": {
          "mutedMethods": [
            "options",
          ],
          "mutedParameters": [],
        },
      },
    ],
  ],
  "logCalls": [
    [
      "warning",
      "📥 - Retrieving schema...",
    ],
    [
      "warning",
      "📇 - Writing Open API schema...",
    ],
  ],
  "output": "{
  "openapi": "3.1.0",
  "info": {
    "version": "0.0.0",
    "title": "api",
    "description": "The API"
  }
}",
  "result": undefined,
}
`,
    );
  });
});
