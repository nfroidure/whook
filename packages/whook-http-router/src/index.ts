import bytes from 'bytes';
import Stream from 'stream';
import { initializer } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { printStackTrace, YError } from 'yerror';
import { Siso } from 'siso';
import Ajv from 'ajv';
import addAJVFormats from 'ajv-formats';
import { qsStrict as strictQs } from 'strict-qs';
import { pickFirstHeaderValue } from '@whook/http-transaction';
import {
  OPEN_API_METHODS,
  getOpenAPIOperations,
  dereferenceOpenAPIOperations,
} from './libs/openAPIUtils.js';
import {
  prepareParametersValidators,
  applyValidators,
  filterHeaders,
  prepareBodyValidator,
  extractOperationSecurityParameters,
  castSchemaValue,
  castParameters,
} from './libs/validation.js';
import {
  type WhookBodySpec,
  type WhookResponseSpec,
  extractBodySpec,
  extractResponseSpec,
  checkResponseCharset,
  checkResponseMediaType,
  executeHandler,
  extractProduceableMediaTypes,
  extractConsumableMediaTypes,
} from './libs/utils.js';
import { getBody, sendBody } from './libs/body.js';
import initErrorHandler, {
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  DEFAULT_ERRORS_DESCRIPTORS,
  DEFAULT_DEFAULT_ERROR_CODE,
} from './services/errorHandler.js';
import {
  DEFAULT_DEBUG_NODE_ENVS,
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_PARSERS,
  DEFAULT_STRINGIFYERS,
  DEFAULT_DECODERS,
  DEFAULT_ENCODERS,
} from './libs/constants.js';
import type {
  WhookRawOperation,
  SupportedSecurityScheme,
} from './libs/openAPIUtils.js';
import type { JsonValue } from 'type-fest';
import type { QSParameter } from 'strict-qs';
import type { Provider } from 'knifecycle';
import type { Transform, Readable } from 'stream';
import type {
  WhookHandler,
  WhookOperation,
  WhookHTTPTransactionService,
  DereferencedParameterObject,
  WhookResponse,
} from '@whook/http-transaction';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { LogService } from 'common-services';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  WhookErrorsDescriptors,
  WhookErrorDescriptor,
  WhookErrorHandlerConfig,
  WhookErrorHandlerDependencies,
  WhookErrorHandler,
} from './services/errorHandler.js';
import type { ValidateFunction } from 'ajv';
import type { AppEnvVars } from 'application-services';

const SEARCH_SEPARATOR = '?';
const PATH_SEPARATOR = '/';

function noop() {
  return undefined;
}
function identity<T>(x: T): T {
  return x;
}

export type {
  WhookErrorHandler,
  WhookErrorHandlerDependencies,
  WhookErrorsDescriptors,
  WhookErrorDescriptor,
  WhookErrorHandlerConfig,
  WhookBodySpec,
  WhookResponseSpec,
  WhookRawOperation,
  SupportedSecurityScheme,
};
export {
  OPEN_API_METHODS,
  DEFAULT_DEBUG_NODE_ENVS,
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_PARSERS,
  DEFAULT_STRINGIFYERS,
  DEFAULT_DECODERS,
  DEFAULT_ENCODERS,
  initErrorHandler,
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  DEFAULT_ERRORS_DESCRIPTORS,
  DEFAULT_DEFAULT_ERROR_CODE,
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
  extractOperationSecurityParameters,
  castSchemaValue,
  castParameters,
  prepareParametersValidators,
  prepareBodyValidator,
  applyValidators,
  filterHeaders,
  extractBodySpec,
  extractResponseSpec,
  checkResponseCharset,
  checkResponseMediaType,
  executeHandler,
  extractProduceableMediaTypes,
  extractConsumableMediaTypes,
  getBody,
  sendBody,
};

export type WhookQueryStringParser = (
  definitions: Parameters<typeof strictQs>[1],
  query: Parameters<typeof strictQs>[2],
) => ReturnType<typeof strictQs>;
export type WhookHandlerName = string;
export type WhookHandlersService<T extends WhookHandler> = Record<
  WhookHandlerName,
  T
>;
export type WhookParser = (
  content: string,
  bodySpec?: WhookBodySpec,
) => JsonValue;
export type WhookParsers = { [name: string]: WhookParser };
export type WhookStringifyer = (content: string) => string;
export type WhookStringifyers = { [name: string]: WhookStringifyer };
export type WhookEncoder<T extends Transform> = {
  new (...args: unknown[]): T;
};
export type WhookEncoders<T extends Transform> = {
  [name: string]: WhookEncoder<T>;
};
export type WhookDecoder<T extends Transform> = {
  new (...args: unknown[]): T;
};
export type WhookDecoders<T extends Transform> = {
  [name: string]: WhookDecoder<T>;
};
export type WhookHTTPRouterConfig = {
  DEBUG_NODE_ENVS?: string[];
  BUFFER_LIMIT?: string;
  BASE_PATH?: string;
};
export type WhookHTTPRouterDependencies<T extends WhookHandler> =
  WhookHTTPRouterConfig & {
    ENV: AppEnvVars;
    HANDLERS: WhookHandlersService<T>;
    API: OpenAPIV3_1.Document;
    PARSERS?: WhookParsers;
    STRINGIFYERS?: WhookStringifyers;
    DECODERS?: WhookEncoders<Transform>;
    ENCODERS?: WhookDecoders<Transform>;
    QUERY_PARSER?: WhookQueryStringParser;
    log?: LogService;
    httpTransaction: WhookHTTPTransactionService;
    errorHandler: WhookErrorHandler;
  };
export interface WhookHTTPRouterService {
  (req: IncomingMessage, res: ServerResponse): Promise<void>;
}
export type WhookHTTPRouterProvider = Provider<WhookHTTPRouterService>;

type RouteDescriptor = {
  handler: WhookHandler;
  consumableMediaTypes: string[];
  produceableMediaTypes: string[];
  operation: WhookOperation;
  validators: {
    [name: string]: ValidateFunction;
  };
  bodyValidator: (
    operation: WhookOperation,
    contentType: string,
    body: JsonValue | Readable | void,
  ) => void;
};

/* Architecture Note #1: HTTP Router
The `httpRouter` service is responsible for handling
 the request, validating it and wiring the handlers
 response to the actual HTTP response.

It is very opiniated and clearly diverges from the
 current standards based on a middlewares/plugins
 approach.

Here, the single source of truth is your API
 definition. No documentation, no route.
*/

export default initializer(
  {
    name: 'httpRouter',
    type: 'provider',
    inject: [
      'ENV',
      '?DEBUG_NODE_ENVS',
      '?BUFFER_LIMIT',
      '?BASE_PATH',
      'HANDLERS',
      'API',
      '?PARSERS',
      '?STRINGIFYERS',
      '?DECODERS',
      '?ENCODERS',
      '?QUERY_PARSER',
      '?log',
      'httpTransaction',
      'errorHandler',
    ],
  },
  initHTTPRouter,
);

/**
 * Initialize an HTTP router
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   services.ENV
 * The injected ENV value
 * @param  {Array}   [services.DEBUG_NODE_ENVS]
 * The environnement that activate debugging
 *  (prints stack trace in HTTP errors responses)
 * @param  {String}   [services.BUFFER_LIMIT]
 * The maximum bufferisation before parsing the
 *  request body
 * @param  {String}   [services.BASE_PATH]
 * API base path
 * @param  {Object}   services.HANDLERS
 * The handlers for the operations decribe
 *  by the OpenAPI API definition
 * @param  {Object}   services.API
 * The OpenAPI definition of the API
 * @param  {Object} [services.PARSERS]
 * The synchronous body parsers (for operations
 *  that defines a request body schema)
 * @param  {Object} [services.STRINGIFYERS]
 * The synchronous body stringifyers (for
 *  operations that defines a response body
 *  schema)
 * @param  {Object} [services.ENCODERS]
 * A map of encoder stream constructors
 * @param  {Object} [services.DECODERS]
 * A map of decoder stream constructors
 * @param  {Object} [services.QUERY_PARSER]
 * A query parser with the `strict-qs` signature
 * @param  {Function} [services.log=noop]
 * A logging function
 * @param  {Function} services.httpTransaction
 * A function to create a new HTTP transaction
 * @return {Promise}
 * A promise of a function to handle HTTP requests.
 */
async function initHTTPRouter<T extends WhookHandler>({
  ENV,
  DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
  BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
  BASE_PATH = '',
  HANDLERS,
  API,
  PARSERS = DEFAULT_PARSERS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
  DECODERS = DEFAULT_DECODERS,
  ENCODERS = DEFAULT_ENCODERS,
  QUERY_PARSER = strictQs.bind(null, {} as Parameters<typeof strictQs>[0]),
  log = noop,
  httpTransaction,
  errorHandler,
}: WhookHTTPRouterDependencies<T>): Promise<WhookHTTPRouterProvider> {
  const bufferLimit = bytes.parse(BUFFER_LIMIT);
  const consumableCharsets = Object.keys(DECODERS);
  const produceableCharsets = Object.keys(ENCODERS);
  const defaultResponseSpec = {
    contentTypes: Object.keys(STRINGIFYERS),
    charsets: produceableCharsets,
  };
  const ajv = new Ajv.default({
    verbose: DEBUG_NODE_ENVS.includes(ENV.NODE_ENV),
    strict: true,
    logger: {
      log: (...args: string[]) => log('debug', ...args),
      warn: (...args: string[]) => log('warning', ...args),
      error: (...args: string[]) => log('error', ...args),
    },
  });

  addAJVFormats.default(ajv);

  const routers = await _createRouters<T>({
    API,
    HANDLERS,
    BASE_PATH,
    ajv,
    log,
  });

  let handleFatalError;
  const fatalErrorPromise: Promise<void> = new Promise((resolve, reject) => {
    handleFatalError = reject;
  });

  log('debug', '🚦 - HTTP Router initialized.');

  return {
    service: httpRouter,
    fatalErrorPromise,
  };

  /**
   * Handle an HTTP incoming message
   * @param  {HTTPRequest}  req
   * A raw NodeJS HTTP incoming message
   * @param  {HTTPResponse} res
   * A raw NodeJS HTTP response
   * @return {Promise}
   * A promise resolving when the operation
   *  completes
   */
  async function httpRouter(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      let operation: WhookOperation;
      let responseSpec = defaultResponseSpec;

      const { request, transaction } = await httpTransaction(req, res);

      await transaction
        .start(async () => {
          const method = request.method;
          const path = request.url.split(SEARCH_SEPARATOR)[0];
          const parts = path.split(PATH_SEPARATOR).filter(identity);
          let [result, pathParameters] = routers[method]
            ? routers[method].find(parts)
            : [];

          // Second chance for HEAD calls
          if (!result && 'head' === method) {
            [result, pathParameters] = routers.get
              ? routers.get.find(parts)
              : [];
          }

          const {
            handler,
            operation: _operation_,
            validators,
            bodyValidator,
            consumableMediaTypes,
            produceableMediaTypes,
          } = result || {};

          if (!handler) {
            log('debug', '❌ - No handler found for: ', method, parts);
            throw new YHTTPError(
              404,
              'E_NOT_FOUND',
              method,
              parts,
              PATH_SEPARATOR + parts.join(PATH_SEPARATOR),
            );
          }

          operation = _operation_ as WhookOperation;

          const search = request.url.substr(
            request.url.split(SEARCH_SEPARATOR)[0].length,
          );
          const bodySpec = extractBodySpec(
            request,
            consumableMediaTypes || [],
            consumableCharsets,
          );
          let parameters;

          responseSpec = extractResponseSpec(
            operation,
            request,
            produceableMediaTypes || [],
            produceableCharsets,
          );

          try {
            const body = await getBody(
              {
                DECODERS,
                PARSERS,
                bufferLimit,
              },
              operation,
              request.body as Readable,
              bodySpec,
            );
            // TODO: Update strictQS to handle OpenAPI 3
            const retroCompatibleQueryParameters = (operation.parameters || [])
              .filter((p) => p.in === 'query')
              .map((p) => ({ ...p, ...p.schema }));
            const headersParameters = (operation.parameters || []).filter(
              (p) => p.in === 'header',
            );

            parameters = {
              ...pathParameters,
              ...QUERY_PARSER(
                retroCompatibleQueryParameters as unknown as QSParameter[],
                search,
              ),
              ...castParameters(
                headersParameters,
                filterHeaders(headersParameters, request.headers),
              ),
            };

            applyValidators(
              operation,
              validators as RouteDescriptor['validators'],
              parameters,
            );

            (bodyValidator as RouteDescriptor['bodyValidator'])(
              operation,
              bodySpec.contentType,
              body,
            );

            parameters = {
              ...parameters,
              ...('undefined' !== typeof body ? { body } : {}),
            };
          } catch (err) {
            throw YHTTPError.cast(err as Error, 400);
          }

          const response = await executeHandler(operation, handler, parameters);

          response.headers = response.headers || {};

          if (response.body) {
            response.headers['content-type'] =
              response.headers['content-type'] || responseSpec.contentTypes[0];
          }

          const responseContentType =
            pickFirstHeaderValue('content-type', response.headers || {}) ||
            'text/plain';

          // Check the stringifyer only when a schema is
          // specified and it is not a binary one
          const responseHasSchema =
            operation.responses &&
            operation.responses[response.status] &&
            operation.responses[response.status].content &&
            operation.responses[response.status].content?.[
              responseContentType
            ] &&
            operation.responses[response.status].content?.[responseContentType]
              .schema &&
            (operation.responses[response.status].content?.[responseContentType]
              .schema.type !== 'string' ||
              operation.responses[response.status].content?.[
                responseContentType
              ].schema.format !== 'binary');

          if (responseHasSchema && !STRINGIFYERS[responseContentType]) {
            throw new YHTTPError(
              500,
              'E_STRINGIFYER_LACK',
              response.headers['content-type'],
              response,
            );
          }
          if (response.body) {
            checkResponseMediaType(
              request,
              responseSpec,
              produceableMediaTypes || [],
            );
            checkResponseCharset(request, responseSpec, produceableCharsets);
          }

          return response;
        })
        .catch(transaction.catch)
        .catch(errorHandler.bind(null, transaction.id, responseSpec))
        .then(async (response) => {
          // We can safely assume response is not void since
          // error handler is supposed to rethrow any catched
          // error
          let castedResponse = response as WhookResponse;

          if (castedResponse.body && 'head' === request.method) {
            log(
              'debug',
              '💇 - Body stripped:',
              castedResponse.body instanceof Stream
                ? 'Stream'
                : castedResponse.body,
            );
            castedResponse = {
              ...castedResponse,
              body: undefined,
            };
          }

          await transaction.end(
            await sendBody(
              {
                ENCODERS,
                STRINGIFYERS,
              },
              castedResponse,
            ),
            operation ? operation.operationId : 'none',
          );
        });
    } catch (err) {
      log('error', '☢️ - Unrecovable router error...');
      log('error-stack', printStackTrace(err as Error));
      handleFatalError(err);
    }
  }
}

function _explodePath(
  path: string,
  parameters: DereferencedParameterObject[],
): (string | DereferencedParameterObject)[] {
  return path
    .split(PATH_SEPARATOR)
    .filter(identity)
    .map((node) => {
      const matches = /^{([a-z0-9]+)}$/i.exec(node);

      if (!matches) {
        return node;
      }

      const parameter = (parameters || []).find(
        (aParameter) => aParameter.name === matches[1],
      );

      if (!parameter) {
        throw new YError('E_UNDECLARED_PATH_PARAMETER', path, node);
      }
      return parameter;
    });
}

async function _createRouters<T extends WhookHandler>({
  API,
  HANDLERS,
  BASE_PATH = '',
  ajv,
  log,
}: {
  API: OpenAPIV3_1.Document;
  HANDLERS: WhookHandlersService<T>;
  BASE_PATH?: string;
  ajv: Ajv.default;
  log: LogService;
}): Promise<{ [method: string]: Siso<RouteDescriptor> }> {
  const routers = {};
  const operations = await dereferenceOpenAPIOperations(
    API,
    getOpenAPIOperations(API),
  );

  operations.forEach((operation) => {
    const { path, method, operationId, parameters } = operation;

    if (!path.startsWith(PATH_SEPARATOR)) {
      throw new YError('E_BAD_PATH', path);
    }
    if (!operationId) {
      throw new YError('E_NO_OPERATION_ID', path, method);
    }

    if (!HANDLERS[operationId]) {
      throw new YError('E_NO_HANDLER', operationId);
    }

    const handler = HANDLERS[operationId];

    // TODO: create a new major version of Siso to handle OpenAPI
    // path params mode widely
    const pathParameters = ((parameters || []) as OpenAPIV3_1.ParameterObject[])
      .filter((p) => 'path' === p.in)
      .map((p) => {
        if (p.style) {
          log('warning', '⚠️ - Only a style subset is supported currently!');
        }

        return {
          ...p,
          // TODO: Remove when this issue is tackled:
          // https://github.com/nfroidure/siso/issues/45
          ...((p.schema as OpenAPIV3_1.SchemaObject)?.enum
            ? {}
            : {
                pattern: '^.*$',
              }),
          ...p.schema,
          schema: undefined,
        };
      });
    const ammendedParameters = extractOperationSecurityParameters(
      API,
      operation,
    );

    routers[method] = routers[method] || new Siso();
    routers[method].register(
      _explodePath(
        BASE_PATH + path,
        pathParameters as unknown[] as DereferencedParameterObject[],
      ),
      _prepareRoute({ ajv }, operation, handler, ammendedParameters),
    );
  });

  return routers;
}

function _prepareRoute(
  { ajv }: { ajv: Ajv.default },
  operation: WhookOperation,
  handler: WhookHandler,
  ammendedParameters: DereferencedParameterObject[] = [],
) {
  const consumableMediaTypes = extractConsumableMediaTypes(operation);
  const produceableMediaTypes = extractProduceableMediaTypes(operation);
  const parameters = (operation.parameters || []).concat(ammendedParameters);

  return {
    handler,
    consumableMediaTypes,
    produceableMediaTypes,
    operation: {
      ...operation,
      parameters,
    },
    validators: prepareParametersValidators(
      ajv,
      operation.operationId,
      parameters,
    ),
    bodyValidator: prepareBodyValidator(ajv, operation),
  };
}
