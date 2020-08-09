import initGenerateOpenAPISchema from './generateOpenAPISchema';
import { PassThrough } from 'stream';
import type { WhookCommandArgs } from '@whook/cli';

describe('generateOpenAPISchema', () => {
  const getOpenAPI = jest.fn();
  const log = jest.fn();

  beforeEach(() => {
    getOpenAPI.mockReset();
    log.mockReset();
  });

  it('should work', async () => {
    getOpenAPI.mockResolvedValueOnce({
      status: 200,
      body: {
        openapi: '3.0.2',
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
      args: (Object.assign(
        {
          pretty: true,
        },
        {
          _: ['generateOpenAPISchema'],
        },
      ) as unknown) as WhookCommandArgs,
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
      Object {
        "getOpenAPICalls": Array [
          Array [
            Object {
              "authenticated": true,
              "mutedMethods": Array [
                "options",
              ],
              "mutedParameters": Array [],
            },
          ],
        ],
        "logCalls": Array [
          Array [
            "warning",
            "📥 - Retrieving schema...",
          ],
          Array [
            "warning",
            "📇 - Writing Open API schema...",
          ],
        ],
        "output": "{
        \\"openapi\\": \\"3.0.2\\",
        \\"info\\": {
          \\"version\\": \\"0.0.0\\",
          \\"title\\": \\"api\\",
          \\"description\\": \\"The API\\"
        }
      }",
        "result": undefined,
      }
    `,
    );
  });
});
