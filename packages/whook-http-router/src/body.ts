import HTTPError from 'yhttperror';
import FirstChunkStream from 'first-chunk-stream';
import Stream from 'stream';
import YError from 'yerror';
import type { WhookOperation } from '@whook/http-transaction';
import type { BodySpec } from './lib';
import type { OpenAPIV3 } from 'openapi-types';

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
export async function getBody(
  { DECODERS, PARSERS, bufferLimit },
  operation: WhookOperation,
  inputStream: Stream.Readable,
  bodySpec: BodySpec,
): Promise<Stream.Readable | {} | void> {
  const bodyIsEmpty = !(bodySpec.contentType && bodySpec.contentLength);
  const requestBody = operation.requestBody
    ? (operation.requestBody as OpenAPIV3.RequestBodyObject)
    : undefined;
  const schemaObject =
    requestBody &&
    requestBody.content &&
    requestBody.content[bodySpec.contentType] &&
    requestBody.content[bodySpec.contentType].schema &&
    (requestBody.content[bodySpec.contentType]
      .schema as OpenAPIV3.NonArraySchemaObject);
  const bodyIsParseable =
    schemaObject &&
    (schemaObject.type !== 'string' || schemaObject.format !== 'binary');

  if (bodyIsEmpty) {
    return Promise.resolve();
  }

  if (!bodyIsParseable) {
    return Promise.resolve(inputStream);
  }
  if (!PARSERS[bodySpec.contentType]) {
    return Promise.reject(
      new HTTPError(500, 'E_PARSER_LACK', bodySpec.contentType),
    );
  }

  if (bodySpec.contentLength > bufferLimit) {
    throw new HTTPError(
      400,
      'E_REQUEST_CONTENT_TOO_LARGE',
      bodySpec.contentLength,
      bufferLimit,
    );
  }

  const body: Buffer = await new Promise((resolve, reject) => {
    const Decoder = DECODERS[bodySpec.charset];

    inputStream.on('error', (err) => {
      reject(HTTPError.wrap(err, 400, 'E_REQUEST_FAILURE'));
    });
    inputStream.pipe(new Decoder()).pipe(
      new FirstChunkStream(
        {
          chunkSize: bufferLimit + 1,
        },
        async (chunk) => {
          if (bufferLimit >= chunk.length) {
            resolve(chunk);
            return chunk;
          }

          reject(
            new HTTPError(
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
    throw new HTTPError(
      400,
      'E_BAD_BODY_LENGTH',
      body.length,
      bodySpec.contentLength,
    );
  }

  try {
    return await new Promise((resolve, reject) => {
      try {
        resolve(PARSERS[bodySpec.contentType](body.toString(), bodySpec));
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    throw HTTPError.wrap(err, 400, 'E_BAD_BODY', body.toString());
  }
}

export async function sendBody({ ENCODERS, STRINGIFYERS }, response) {
  if (!response.body) {
    return response;
  }

  if (response.body instanceof Stream) {
    return response;
  }

  if (!STRINGIFYERS[response.headers['content-type']]) {
    throw new YError(
      'E_STRINGIFYER_LACK',
      response.headers['content-type'],
      response,
    );
  }

  const Encoder = ENCODERS['utf-8'];
  const stream = new Encoder();
  const content = STRINGIFYERS[response.headers['content-type']](response.body);

  stream.write(content);

  stream.end();

  return {
    ...response,
    headers: {
      'content-type': `${response.headers['content-type']}; charset=utf-8`,
      ...response.headers,
    },
    body: stream,
  };
}
