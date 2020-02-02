import bytes from 'bytes';
import Stream, { Transform } from 'stream';
import { initializer, Provider } from 'knifecycle';
import HTTPError from 'yhttperror';
import YError from 'yerror';
import Siso from 'siso';
import Ajv from 'ajv';
import strictQs from 'strict-qs';
import {
  WhookHandler,
  WhookOperation,
  HTTPTransactionService,
} from '@whook/http-transaction';
import { flattenOpenAPI, getOpenAPIOperations } from './utils';
import {
  prepareParametersValidators,
  applyValidators,
  filterHeaders,
  prepareBodyValidator,
  extractOperationSecurityParameters,
} from './validation';
import {
  extractBodySpec,
  extractResponseSpec,
  checkResponseCharset,
  checkResponseMediaType,
  executeHandler,
  extractProduceableMediaTypes,
  extractConsumableMediaTypes,
} from './lib';
import { getBody, sendBody } from './body';
import initErrorHandler, { WhookErrorHandler } from './errorHandler';
import {
  DEFAULT_DEBUG_NODE_ENVS,
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_PARSERS,
  DEFAULT_STRINGIFYERS,
  DEFAULT_DECODERS,
  DEFAULT_ENCODERS,
} from './constants';
import { OpenAPIV3 } from 'openapi-types';
import { LogService } from 'common-services';
import { IncomingMessage, ServerResponse } from 'http';

const SEARCH_SEPARATOR = '?';

function noop() {}
function identity(x) {
  return x;
}

export {
  initErrorHandler,
  WhookErrorHandler,
  flattenOpenAPI,
  getOpenAPIOperations,
};

export type WhookHandlers = { [name: string]: WhookHandler };
export type WhookParser = (content: string) => string;
export type WhookParsers = { [name: string]: WhookParser };
export type WhookStringifyer = (content: string) => string;
export type WhookStringifyers = { [name: string]: WhookStringifyer };
export type WhookEncoder<T extends Transform> = {
  new (...args: any[]): T;
};
export type WhookEncoders<T extends Transform> = {
  [name: string]: WhookEncoder<T>;
};
export type WhookDecoder<T extends Transform> = {
  new (...args: any[]): T;
};
export type WhookDecoders<T extends Transform> = {
  [name: string]: WhookDecoder<T>;
};
export type HTTPRouterConfig = {
  NODE_ENV?: string;
  DEBUG_NODE_ENVS?: string[];
  BUFFER_LIMIT?: string;
  BASE_PATH: string;
};
export type HTTPRouterDependencies = HTTPRouterConfig & {
  NODE_ENV: string;
  HANDLERS: WhookHandlers;
  API: OpenAPIV3.Document;
  PARSERS?: WhookParsers;
  STRINGIFYERS?: WhookStringifyers;
  DECODERS?: WhookEncoders<Transform>;
  ENCODERS?: WhookDecoders<Transform>;
  QUERY_PARSER?: typeof strictQs;
  log?: LogService;
  httpTransaction: HTTPTransactionService;
  errorHandler: Function;
};
export interface HTTPRouterService {
  (req: IncomingMessage, res: ServerResponse): Promise<void>;
}
export type HTTPRouterProvider = Provider<HTTPRouterService>;

type RouteDescriptor = {
  handler: WhookHandler;
  consumableMediaTypes: string[];
  produceableMediaTypes: string[];
  operation: WhookOperation;
  validators: {
    [name: string]: Ajv.ValidateFunction;
  };
  bodyValidator: (
    operation: WhookOperation,
    contentType: string,
    body: any,
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
      'NODE_ENV',
      '?DEBUG_NODE_ENVS',
      '?BUFFER_LIMIT',
      'BASE_PATH',
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
    options: { singleton: true },
  },
  initHTTPRouter,
);

/**
 * Initialize an HTTP router
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
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
async function initHTTPRouter({
  NODE_ENV,
  DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
  BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
  BASE_PATH,
  HANDLERS,
  API,
  PARSERS = DEFAULT_PARSERS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
  DECODERS = DEFAULT_DECODERS,
  ENCODERS = DEFAULT_ENCODERS,
  QUERY_PARSER = strictQs,
  log = noop,
  httpTransaction,
  errorHandler,
}: HTTPRouterDependencies): Promise<HTTPRouterProvider> {
  const bufferLimit = bytes.parse(BUFFER_LIMIT);
  const ajv = new Ajv({
    verbose: DEBUG_NODE_ENVS.includes(NODE_ENV),
    strictKeywords: true,
  });
  const consumableCharsets = Object.keys(DECODERS);
  const produceableCharsets = Object.keys(ENCODERS);
  const defaultResponseSpec = {
    contentTypes: Object.keys(STRINGIFYERS),
    charsets: produceableCharsets,
  };

  const routers = await _createRouters({ API, HANDLERS, BASE_PATH, ajv, log });

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
      let operation;
      let responseSpec = defaultResponseSpec;

      const { request, transaction } = await httpTransaction(req, res);

      await transaction
        .start(async () => {
          const method = request.method;
          const path = request.url.split(SEARCH_SEPARATOR)[0];
          const parts = path.split('/').filter(a => a);
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
            throw new HTTPError(404, 'E_NOT_FOUND', method, parts);
          }

          operation = _operation_;

          const search = request.url.substr(
            request.url.split(SEARCH_SEPARATOR)[0].length,
          );
          const bodySpec = extractBodySpec(
            request,
            consumableMediaTypes,
            consumableCharsets,
          );
          let parameters;

          responseSpec = extractResponseSpec(
            operation,
            request,
            produceableMediaTypes,
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
              request.body,
              bodySpec,
            );
            // TODO: Update strictQS to handle OpenAPI 3
            const retroCompatibleQueryParameters = (operation.parameters || [])
              .filter(p => p.in === 'query')
              .map(p => ({ ...p, ...p.schema }));

            parameters = {
              ...pathParameters,
              ...QUERY_PARSER(retroCompatibleQueryParameters, search),
              ...filterHeaders(operation.parameters, request.headers),
            };

            applyValidators(operation, validators, parameters);

            bodyValidator(operation, bodySpec.contentType, body);

            parameters = {
              ...parameters,
              ...('undefined' !== typeof body ? { body } : {}),
            };
          } catch (err) {
            throw HTTPError.cast(err, 400);
          }

          const response = await executeHandler(operation, handler, parameters);

          if (response.body) {
            response.headers['content-type'] =
              response.headers['content-type'] || responseSpec.contentTypes[0];
          }

          // Check the stringifyer only when a schema is
          // specified and it is not a binary one
          const responseHasSchema =
            operation.responses &&
            operation.responses[response.status] &&
            operation.responses[response.status].content &&
            operation.responses[response.status].content[
              response.headers['content-type']
            ] &&
            operation.responses[response.status].content[
              response.headers['content-type']
            ].schema &&
            (operation.responses[response.status].content[
              response.headers['content-type']
            ].schema.type !== 'string' ||
              operation.responses[response.status].content[
                response.headers['content-type']
              ].schema.format !== 'binary');

          if (
            responseHasSchema &&
            !STRINGIFYERS[response.headers['content-type']]
          ) {
            throw new HTTPError(
              500,
              'E_STRINGIFYER_LACK',
              response.headers['content-type'],
            );
          }
          if (response.body) {
            checkResponseMediaType(
              request,
              responseSpec,
              produceableMediaTypes,
            );
            checkResponseCharset(request, responseSpec, produceableCharsets);
          }

          return response;
        })
        .catch(transaction.catch)
        .catch(errorHandler.bind(null, transaction.id, responseSpec))
        .then(async response => {
          if (response.body && 'head' === request.method) {
            log(
              'warning',
              'Body stripped:',
              response.body instanceof Stream ? 'Stream' : response.body,
            );
            response = {
              ...response,
              body: undefined,
            };
          }

          await transaction.end(
            await sendBody(
              {
                ENCODERS,
                STRINGIFYERS,
              },
              response,
            ),
            operation ? operation.operationId : 'none',
          );
        });
    } catch (err) {
      log('error', '☢️ - Unrecovable router error...');
      log('stack', err.stack);
      handleFatalError(err);
    }
  }
}

function _explodePath(path, parameters) {
  return path
    .split('/')
    .filter(identity)
    .map(node => {
      const matches = /^{([a-z0-9]+)}$/i.exec(node);

      if (!matches) {
        return node;
      }

      const parameter = (parameters || []).find(
        aParameter => aParameter.name === matches[1],
      );

      if (!parameter) {
        throw new YError('E_UNDECLARED_PATH_PARAMETER', node);
      }
      return parameter;
    });
}

async function _createRouters({
  API,
  HANDLERS,
  BASE_PATH,
  ajv,
  log,
}: {
  API: OpenAPIV3.Document;
  HANDLERS: WhookHandlers;
  BASE_PATH: string;
  ajv: Ajv.Ajv;
  log: LogService;
}): Promise<{ [method: string]: Siso<RouteDescriptor> }> {
  const routers = {};
  const flattenedAPI = await flattenOpenAPI(API);
  const operations = await getOpenAPIOperations(flattenedAPI);

  operations.forEach(operation => {
    const { path, method, operationId, parameters } = operation;

    if (!path.startsWith('/')) {
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
    const pathParameters = ((parameters || []) as OpenAPIV3.ParameterObject[])
      .filter(p => 'path' === p.in)
      .map(p => {
        if (p.style) {
          log('warning', '⚠️ - Only a style subset is supported currently!');
        }
        return {
          ...p,
          ...p.schema,
        };
      });
    const ammendedParameters = extractOperationSecurityParameters(
      flattenedAPI,
      operation,
    );

    routers[method] = routers[method] || new Siso();
    routers[method].register(
      _explodePath((BASE_PATH || '') + path, pathParameters),
      _prepareRoute({ ajv }, operation, handler, ammendedParameters),
    );
  });

  return routers;
}

function _prepareRoute(
  { ajv }: { ajv: Ajv.Ajv },
  operation: WhookOperation,
  handler: WhookHandler,
  ammendedParameters: OpenAPIV3.ParameterObject[] = [],
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
      parameters as OpenAPIV3.ParameterObject[],
    ),
    bodyValidator: prepareBodyValidator(ajv, operation),
  };
}
