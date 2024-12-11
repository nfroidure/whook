import { YHTTPError } from 'yhttperror';
import FirstChunkStream from 'first-chunk-stream';
import { YError } from 'yerror';
import { type OpenAPIV3_1 } from 'openapi-types';
import { type JsonValue } from 'type-fest';
import { pickFirstHeaderValue } from './headers.js';
import { Readable, type Transform } from 'node:stream';
import {
  type WhookDecoders,
  type WhookEncoders,
  type WhookParsers,
  type WhookStringifyers,
} from '../services/httpRouter.js';
import {
  type WhookBodySpec,
  type WhookOperation,
  type WhookResponse,
} from '../index.js';

/* Architecture Note #1.1: Request body
According to the OpenAPI specification
there are two kinds of requests:
- **validated contents:** it implies to
 buffer their content and parse them to
 finally validate it. In that case, we
 provide it as a plain JS object to the
 handlers.
- **streamable contents:** often used
 for large files, those contents must
 be parsed and validated into the
 handler itself.
*/
export async function getBody<
  T extends Readable | JsonValue | void = Readable | JsonValue | void,
>(
  {
    DECODERS,
    PARSERS,
    bufferLimit,
  }: {
    DECODERS?: WhookDecoders<Transform>;
    PARSERS?: WhookParsers;
    bufferLimit: number;
  },
  operation: WhookOperation,
  inputStream: Readable,
  bodySpec: WhookBodySpec,
): Promise<T | undefined> {
  const bodyIsEmpty = !(bodySpec.contentType && bodySpec.contentLength);
  const requestBody = operation.requestBody
    ? (operation.requestBody as OpenAPIV3_1.RequestBodyObject)
    : undefined;
  const schemaObject =
    requestBody &&
    requestBody.content &&
    requestBody.content[bodySpec.contentType] &&
    requestBody.content[bodySpec.contentType].schema &&
    (requestBody.content[bodySpec.contentType]
      .schema as OpenAPIV3_1.NonArraySchemaObject);
  const bodyIsParseable =
    schemaObject &&
    (schemaObject.type !== 'string' || schemaObject.format !== 'binary');

  if (bodyIsEmpty) {
    return;
  }

  if (!bodyIsParseable) {
    return inputStream as T;
  }
  if (!PARSERS?.[bodySpec.contentType]) {
    return Promise.reject(
      new YHTTPError(500, 'E_PARSER_LACK', bodySpec.contentType),
    );
  }

  if (bodySpec.contentLength > bufferLimit) {
    throw new YHTTPError(
      400,
      'E_REQUEST_CONTENT_TOO_LARGE',
      bodySpec.contentLength,
      bufferLimit,
    );
  }

  const body: Buffer = await new Promise((resolve, reject) => {
    const Decoder = DECODERS?.[bodySpec.charset];

    if (!Decoder) {
      return Promise.reject(
        new YHTTPError(500, 'E_DECODER_LACK', bodySpec.charset),
      );
    }

    inputStream.on('error', (err: Error) => {
      reject(YHTTPError.wrap(err as Error, 400, 'E_REQUEST_FAILURE'));
    });
    inputStream.pipe(new Decoder()).pipe(
      new FirstChunkStream(
        {
          chunkSize: bufferLimit + 1,
        },
        async (chunk) => {
          if (bufferLimit >= chunk.length) {
            resolve(Buffer.from(chunk));
            return chunk;
          }

          reject(
            new YHTTPError(
              400,
              'E_REQUEST_CONTENT_TOO_LARGE',
              chunk.length,
              bufferLimit,
            ),
          );
          return FirstChunkStream.stop;
        },
      ),
    );
  });

  if (body.length !== bodySpec.contentLength) {
    throw new YHTTPError(
      400,
      'E_BAD_BODY_LENGTH',
      body.length,
      bodySpec.contentLength,
    );
  }

  try {
    return await new Promise<T>((resolve, reject) => {
      try {
        resolve(PARSERS[bodySpec.contentType](body.toString(), bodySpec) as T);
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    throw YHTTPError.wrap(err as Error, 400, 'E_BAD_BODY', body.toString());
  }
}

export async function sendBody(
  {
    ENCODERS,
    STRINGIFYERS,
  }: {
    ENCODERS?: WhookEncoders<Transform>;
    STRINGIFYERS?: WhookStringifyers;
  },
  response: WhookResponse,
): Promise<WhookResponse> {
  if (!response.body) {
    return response;
  }

  if (response.body instanceof Readable) {
    return response;
  }

  const responseContentType =
    pickFirstHeaderValue('content-type', response.headers || {}) ||
    'text/plain';

  if (!STRINGIFYERS?.[responseContentType]) {
    throw new YError(
      'E_STRINGIFYER_LACK',
      response.headers?.['content-type'],
      response,
    );
  }

  const Encoder = ENCODERS?.['utf-8'];

  if (!Encoder) {
    throw new YError('E_ENCODER_LACK', 'utf-8');
  }

  const stream = new Encoder();
  const content = STRINGIFYERS[responseContentType](response.body as string);

  stream.write(content);

  stream.end();

  return {
    ...response,
    headers: {
      'content-type': `${response.headers?.['content-type']}; charset=utf-8`,
      ...response.headers,
    },
    body: stream,
  };
}
