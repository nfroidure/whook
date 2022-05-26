import initGenerateOpenAPITypes from './generateOpenAPITypes';
import { PassThrough } from 'stream';
import { initGetPingDefinition } from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';

describe('generateOpenAPITypes', () => {
  const getOpenAPI = jest.fn();
  const log = jest.fn();
  const API: OpenAPIV3.Document = {
    openapi: '3.0.2',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [initGetPingDefinition.path]: {
        [initGetPingDefinition.method]: initGetPingDefinition.operation,
      },
    },
  };

  beforeEach(() => {
    getOpenAPI.mockReset();
    log.mockReset();
  });

  it('should work', async () => {
    const instream = new PassThrough();
    const outstream = new PassThrough();
    const outputPromise = new Promise((resolve, reject) => {
      let buffer = Buffer.from('');
      outstream.on('data', (aBuffer) => {
        buffer = Buffer.concat([buffer, aBuffer]);
      });
      outstream.once('error', () => reject);
      outstream.once('end', () => resolve(buffer.toString()));
    });
    const generateOpenAPITypes = await initGenerateOpenAPITypes({
      NODE_ENV: 'development',
      instream,
      outstream,
      log,
    });

    const resultPromise = generateOpenAPITypes();

    instream.write(JSON.stringify(API));
    instream.end();

    expect({
      result: await resultPromise,
      output: await outputPromise,
      getOpenAPICalls: getOpenAPI.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(
      {},
      `
      Object {
        "getOpenAPICalls": Array [],
        "logCalls": Array [
          Array [
            "warning",
            "📥 - Retrieving API schema...",
          ],
          Array [
            "warning",
            "📇 - Writing types...",
          ],
        ],
        "output": "declare namespace API {
          export namespace GetPing {
              export type Output = Responses.$200;
              export type Input = {};
              export namespace Responses {
                  export type $200 = Components.Responses.getPingResponse200<200>;
              }
          }
      }
      declare namespace Components {
          export namespace Responses {
              export type getPingResponse200<S extends number> = {
                  readonly status: S;
                  readonly headers?: {
                      readonly [name: string]: unknown;
                  };
                  readonly body: Components.Schemas.ResponsesgetPingResponse200Body0;
              };
          }
          export namespace Schemas {
              export type ResponsesgetPingResponse200Body0 = NonNullable<{
                  pong?: \\"pong\\";
              }>;
          }
      }",
        "result": undefined,
      }
    `,
    );
  });
});
