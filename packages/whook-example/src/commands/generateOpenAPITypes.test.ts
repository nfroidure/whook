import initGenerateOpenAPITypes from './generateOpenAPITypes';
import { PassThrough } from 'stream';
import { initGetPingDefinition } from '@whook/whook';
import type { WhookCommandArgs } from '@whook/cli';
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
              export type Input = {};
              export type Output = {
                  readonly status: 200;
                  readonly headers?: NonNullable<{
                      [pattern: string]: NonNullable<string>;
                  }>;
                  readonly body: Responses.$200;
              };
              export namespace Responses {
                  export type $200 = Components.Schemas.ApiResponses.GetPing.Response200.Schema0;
              }
          }
      }
      declare namespace Components {
          export namespace Schemas {
              export namespace ApiResponses {
                  export namespace GetPing {
                      export namespace Response200 {
                          export type Schema0 = NonNullable<{
                              pong?: \\"pong\\";
                          }>;
                      }
                  }
              }
          }
      }",
        "result": undefined,
      }
    `,
    );
  });
});
