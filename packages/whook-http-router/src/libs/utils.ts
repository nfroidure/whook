import { YHTTPError } from 'yhttperror';
import contentType from 'content-type';
import preferredCharsets from 'negotiator/lib/charset.js';
import preferredMediaType from 'negotiator/lib/encoding.js';
import { YError } from 'yerror';
import {
  pickFirstHeaderValue,
  pickAllHeaderValues,
} from '@whook/http-transaction';
import type { OpenAPIV3_1 } from 'openapi-types';
import type {
  WhookRequest,
  WhookHandler,
  WhookOperation,
  WhookResponse,
} from '@whook/http-transaction';
import type { Parameters } from 'knifecycle';

const { parse: parseContentType } = contentType;

export type WhookBodySpec = {
  contentType: string;
  contentLength: number;
  charset: 'utf-8';
  boundary?: string;
};
export type WhookResponseSpec = {
  contentTypes: string[];
  charsets: string[];
};

export function extractConsumableMediaTypes(
  operation: WhookOperation,
): string[] {
  if (!operation.requestBody) {
    return [];
  }

  // Per spec contents, the `content` property should always
  // be present so not checking before using it
  // https://swagger.io/specification/#requestBodyObject

  return Object.keys(
    (operation.requestBody as OpenAPIV3_1.RequestBodyObject).content,
  );
}

export function extractProduceableMediaTypes(
  operation: WhookOperation,
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
          ] as OpenAPIV3_1.ResponseObject;

          if (!response.content) {
            return produceableMediaTypes;
          }

          return [...produceableMediaTypes, ...Object.keys(response.content)];
        },
        [] as string[],
      ),
    ),
  ];
}

export function extractBodySpec(
  request: WhookRequest,
  consumableMediaTypes: string[],
  consumableCharsets: string[],
): WhookBodySpec {
  const contentLengthValues = pickAllHeaderValues(
    'content-length',
    request.headers,
  );
  const bodySpec: WhookBodySpec = {
    contentType: '',
    contentLength: contentLengthValues.length
      ? Number(contentLengthValues[0])
      : 0,
    charset: 'utf-8',
  };

  if (request.headers['content-type']) {
    const baseContentType = pickFirstHeaderValue(
      'content-type',
      request.headers,
    );

    try {
      if (typeof baseContentType === 'string') {
        const parsedContentType = parseContentType(baseContentType);

        bodySpec.contentType = parsedContentType.type;
        if (
          parsedContentType.parameters &&
          parsedContentType.parameters.charset
        ) {
          if (
            ['utf-8', 'utf8'].includes(
              parsedContentType.parameters.charset.toLowerCase(),
            )
          ) {
            bodySpec.charset = 'utf-8';
          } else {
            throw new YError(
              'E_UNSUPPORTED_CHARSET',
              parsedContentType.parameters.charset,
            );
          }
        }
        if (
          parsedContentType.parameters &&
          parsedContentType.parameters.boundary
        ) {
          bodySpec.boundary = parsedContentType.parameters.boundary;
        }
      } else {
        throw new YError('E_EMPTY_CONTENT_TYPE');
      }
    } catch (err) {
      throw YHTTPError.wrap(
        err as Error,
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
  bodySpec: WhookBodySpec,
  consumableCharsets: string[],
): void {
  if (
    bodySpec.contentLength &&
    bodySpec.charset &&
    !consumableCharsets.includes(bodySpec.charset)
  ) {
    throw new YHTTPError(
      406,
      'E_UNSUPPORTED_CHARSET',
      bodySpec.charset,
      consumableCharsets,
    );
  }
}

export function checkBodyMediaType(
  bodySpec: WhookBodySpec,
  consumableMediaTypes: string[],
): void {
  if (
    bodySpec.contentLength &&
    bodySpec.contentType &&
    !consumableMediaTypes.includes(bodySpec.contentType)
  ) {
    throw new YHTTPError(
      415,
      'E_UNSUPPORTED_MEDIA_TYPE',
      bodySpec.contentType,
      consumableMediaTypes,
    );
  }
}

export function extractResponseSpec(
  operation: WhookOperation,
  request: WhookRequest,
  supportedMediaTypes: string[],
  supportedCharsets: string[],
): WhookResponseSpec {
  const accept = pickFirstHeaderValue('accept', request.headers) || '*';
  const responseSpec: WhookResponseSpec = {
    charsets: request.headers['accept-charset']
      ? preferredCharsets(
          pickFirstHeaderValue('accept-charset', request.headers),
          supportedCharsets,
        )
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
  responseSpec: WhookResponseSpec,
  produceableMediaTypes: string[],
): void {
  if (0 === responseSpec.contentTypes.length) {
    throw new YHTTPError(
      406,
      'E_UNACCEPTABLE_MEDIA_TYPE',
      request.headers.accept,
      produceableMediaTypes,
    );
  }
}

export function checkResponseCharset(
  request: WhookRequest,
  responseSpec: WhookResponseSpec,
  produceableCharsets: string[],
): void {
  if (0 === responseSpec.charsets.length) {
    throw new YHTTPError(
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
    throw new YHTTPError(
      500,
      'E_NO_RESPONSE_PROMISE',
      operation.operationId,
      operation.method,
      operation.path,
    );
  }

  const response = await responsePromise;

  if (!response) {
    throw new YHTTPError(
      500,
      'E_NO_RESPONSE',
      operation.operationId,
      operation.method,
      operation.path,
    );
  }
  if ('undefined' === typeof response.status) {
    throw new YHTTPError(
      500,
      'E_NO_RESPONSE_STATUS',
      operation.operationId,
      operation.method,
      operation.path,
    );
  }
  if ('number' !== typeof response.status) {
    throw new YHTTPError(
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
