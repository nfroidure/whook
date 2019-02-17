import HTTPError from 'yhttperror';
import firstChunkStream from 'first-chunk-stream';
import Stream from 'stream';

/* Architecture Note #2.1: Request body
According to the Swagger/OpenAPI specification
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
  operation,
  inputStream,
  bodySpec,
) {
  const bodyParameter = (operation.parameters || []).find(
    parameter => 'body' === parameter.in,
  );
  const bodyIsEmpty = !(bodySpec.contentType && bodySpec.contentLength);
  const bodyIsParseable = !(bodyParameter && bodyParameter.schema);

  if (bodyIsEmpty) {
    return Promise.resolve();
  }

  if (bodyIsParseable) {
    return Promise.resolve(inputStream);
  }
  if (!PARSERS[bodySpec.contentType]) {
    return Promise.reject(
      new HTTPError(500, 'E_PARSER_LACK', bodySpec.contentType),
    );
  }
  return new Promise((resolve, reject) => {
    const Decoder = DECODERS[bodySpec.charset];

    inputStream.on('error', err => {
      reject(HTTPError.wrap(err, 400, 'E_REQUEST_FAILURE'));
    });
    inputStream.pipe(new Decoder()).pipe(
      firstChunkStream(
        {
          chunkLength: bufferLimit + 1,
        },
        (err, chunk, enc, cb) => {
          if (err) {
            reject(HTTPError.wrap(err, 400, 'E_REQUEST_FAILURE'));
            cb();
            return;
          }
          if (bufferLimit >= chunk.length) {
            resolve(chunk);
            cb();
            return;
          }
          reject(
            new HTTPError(400, 'E_REQUEST_CONTENT_TOO_LARGE', chunk.length),
          );
          cb();
        },
      ),
    );
  }).then(body => {
    if (body.length !== bodySpec.contentLength) {
      throw new HTTPError(
        400,
        'E_BAD_BODY_LENGTH',
        body.length,
        bodySpec.contentLength,
      );
    }
    return new Promise((resolve, reject) => {
      try {
        resolve(PARSERS[bodySpec.contentType](body.toString(), bodySpec));
      } catch (err) {
        reject(err);
      }
    }).catch(err => {
      throw HTTPError.wrap(err, 400, 'E_BAD_BODY');
    });
  });
}

export async function sendBody(
  { DEBUG_NODE_ENVS, ENV, API, ENCODERS, STRINGIFYERS, log, ajv },
  operation,
  response,
) {
  const schema =
    (operation &&
      operation.responses &&
      operation.responses[response.status] &&
      operation.responses[response.status].schema) ||
    // Here we are diverging from the Swagger specs
    // since global responses object aren't intended
    // to set global responses but for routes that
    // does not exists or that has not been resolved
    // by the router at the time an error were throwed
    // we simply cannot rely on the `operation`'s value.
    // See: https://github.com/OAI/OpenAPI-Specification/issues/563
    (API.responses &&
      API.responses[response.status] &&
      API.responses[response.status].schema);

  if (!response.body) {
    if (schema) {
      log(
        'warning',
        `Declared a schema in the ${operation.id} response but found no body.`,
      );
    }
    return response;
  }

  if (response.body instanceof Stream) {
    if (schema) {
      log(
        'warning',
        `Declared a schema in the ${
          operation.id
        } response but returned a streamed body.`,
      );
    }
    return response;
  }

  const Encoder = ENCODERS['utf-8'];
  const stream = new Encoder();

  if (schema) {
    if (DEBUG_NODE_ENVS.includes(ENV.NODE_ENV)) {
      const validator = ajv.compile(schema);

      // The JSON transforms are here to simulate a real payload
      // transmission (it removes undefined properties for instance)
      if (!validator(JSON.parse(JSON.stringify(response.body)))) {
        log('warning', 'Invalid response:', validator.errors);
      }
    }
  } else {
    // When there is no schema specified for a given
    // response, it means that either the response was
    // not documented or that the request failed before
    // the router could determine which operation were
    // executed.
    log('warning', 'Undocumented response:', response.status, operation);
  }

  stream.write(STRINGIFYERS[response.headers['content-type']](response.body));

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
