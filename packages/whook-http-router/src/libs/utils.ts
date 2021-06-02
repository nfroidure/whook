import HTTPError from 'yhttperror';
import contentType from 'content-type';
import preferredCharsets from 'negotiator/lib/charset';
import preferredMediaType from 'negotiator/lib/encoding';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  WhookRequest,
  WhookHandler,
  WhookOperation,
  WhookResponse,
} from '@whook/http-transaction';
import type { Parameters } from 'knifecycle';

const { parse: parseContentType } = contentType;

export type BodySpec = {
  contentType: string;
  contentLength: number;
  charset: 'utf-8';
  boundary?: string;
};
export type ResponseSpec = {
  contentTypes: string[];
  charsets: string[];
};

export function extractConsumableMediaTypes(
  operation: OpenAPIV3.OperationObject,
): string[] {
  if (!operation.requestBody) {
    return [];
  }

  // Per spec contents, the `content` property should always
  // be present so not checking before using it
  // https://swagger.io/specification/#requestBodyObject

  return Object.keys(
    (operation.requestBody as OpenAPIV3.RequestBodyObject).content,
  );
}

export function extractProduceableMediaTypes(
  operation: OpenAPIV3.OperationObject,
): string[] {
  if (!operation.responses) {
    return [];
  }

  return [
    ...new Set(
      Object.keys(operation.responses).reduce(
        (produceableMediaTypes, status) => {
          const response = operation.responses[
            status
          ] as OpenAPIV3.ResponseObject;

          if (!response.content) {
            return produceableMediaTypes;
          }

          return [...produceableMediaTypes, ...Object.keys(response.content)];
        },
        [],
      ),
    ),
  ];
}

export function extractBodySpec(
  request: WhookRequest,
  consumableMediaTypes: string[],
  consumableCharsets: string[],
): BodySpec {
  const bodySpec: BodySpec = {
    contentType: '',
    contentLength: request.headers['content-length']
      ? Number(request.headers['content-length'])
      : 0,
    charset: 'utf-8',
  };

  if (request.headers['content-type']) {
    try {
      const parsedContentType = parseContentType(
        request.headers['content-type'],
      );

      bodySpec.contentType = parsedContentType.type;
      if (
        parsedContentType.parameters &&
        parsedContentType.parameters.charset
      ) {
        bodySpec.charset = parsedContentType.parameters.charset.toLowerCase();
      }
      if (
        parsedContentType.parameters &&
        parsedContentType.parameters.boundary
      ) {
        bodySpec.boundary = parsedContentType.parameters.boundary;
      }
    } catch (err) {
      throw new HTTPError(
        400,
        'E_BAD_CONTENT_TYPE',
        request.headers['content-type'],
      );
    }
  }

  checkBodyCharset(bodySpec, consumableCharsets);
  checkBodyMediaType(bodySpec, consumableMediaTypes);

  return bodySpec;
}

export function checkBodyCharset(
  bodySpec: BodySpec,
  consumableCharsets: string[],
): void {
  if (
    bodySpec.contentLength &&
    bodySpec.charset &&
    !consumableCharsets.includes(bodySpec.charset)
  ) {
    throw new HTTPError(
      406,
      'E_UNSUPPORTED_CHARSET',
      bodySpec.charset,
      consumableCharsets,
    );
  }
}

export function checkBodyMediaType(
  bodySpec: BodySpec,
  consumableMediaTypes: string[],
): void {
  if (
    bodySpec.contentLength &&
    bodySpec.contentType &&
    !consumableMediaTypes.includes(bodySpec.contentType)
  ) {
    throw new HTTPError(
      415,
      'E_UNSUPPORTED_MEDIA_TYPE',
      bodySpec.contentType,
      consumableMediaTypes,
    );
  }
}

export function extractResponseSpec(
  operation: OpenAPIV3.OperationObject,
  request: WhookRequest,
  supportedMediaTypes: string[],
  supportedCharsets: string[],
): ResponseSpec {
  const accept = (request.headers.accept as string) || '*';
  const responseSpec: ResponseSpec = {
    charsets: request.headers['accept-charset']
      ? preferredCharsets(request.headers['accept-charset'], supportedCharsets)
      : supportedCharsets,
    contentTypes: preferredMediaType(
      accept.replace(/(^|,)\*\/\*($|,|;)/g, '$1*$2'),
      supportedMediaTypes,
    ),
  };

  return responseSpec;
}

export function checkResponseMediaType(
  request: WhookRequest,
  responseSpec: ResponseSpec,
  produceableMediaTypes: string[],
): void {
  if (0 === responseSpec.contentTypes.length) {
    throw new HTTPError(
      406,
      'E_UNACCEPTABLE_MEDIA_TYPE',
      request.headers.accept,
      produceableMediaTypes,
    );
  }
}

export function checkResponseCharset(
  request: WhookRequest,
  responseSpec: ResponseSpec,
  produceableCharsets: string[],
): void {
  if (0 === responseSpec.charsets.length) {
    throw new HTTPError(
      406,
      'E_UNACCEPTABLE_CHARSET',
      request.headers['accept-charset'],
      responseSpec.charsets,
      produceableCharsets,
    );
  }
}

export async function executeHandler(
  operation: WhookOperation,
  handler: WhookHandler,
  parameters: Parameters,
): Promise<WhookResponse> {
  const responsePromise = handler(parameters, operation);

  if (!(responsePromise && responsePromise.then)) {
    throw new HTTPError(
      500,
      'E_NO_RESPONSE_PROMISE',
      operation.operationId,
      operation.method,
      operation.path,
    );
  }

  const response = await responsePromise;

  if (!response) {
    throw new HTTPError(
      500,
      'E_NO_RESPONSE',
      operation.operationId,
      operation.method,
      operation.path,
    );
  }
  if ('undefined' === typeof response.status) {
    throw new HTTPError(
      500,
      'E_NO_RESPONSE_STATUS',
      operation.operationId,
      operation.method,
      operation.path,
    );
  }
  if ('number' !== typeof response.status) {
    throw new HTTPError(
      500,
      'E_NON_NUMERIC_STATUS',
      operation.operationId,
      operation.method,
      operation.path,
    );
  }

  response.headers = response.headers || {};
  return response;
}
