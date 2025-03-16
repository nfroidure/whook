import bytes from 'bytes';
import Stream from 'node:stream';
import { initializer, location } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { printStackTrace, YError } from 'yerror';
import { Siso } from 'siso';
import { pickFirstHeaderValue } from '../libs/headers.js';
import {
  prepareBodyValidator,
  extractOperationSecurityParameters,
  resolveParameters,
  createParametersValidators,
  type WhookBodyValidator,
  type WhookParametersValidators,
} from '../libs/validation.js';
import {
  DEFAULT_COERCION_OPTIONS,
  type WhookCoercionOptions,
} from '../libs/coercion.js';
import {
  extractBodySpec,
  extractResponseSpec,
  checkResponseCharset,
  checkResponseMediaType,
  executeHandler,
  extractProduceableMediaTypes,
  extractConsumableMediaTypes,
  type WhookBodySpec,
} from '../libs/router.js';
import { getBody, sendBody } from '../libs/body.js';
import {
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_PARSERS,
  DEFAULT_STRINGIFYERS,
  DEFAULT_DECODERS,
  DEFAULT_ENCODERS,
} from '../libs/constants.js';
import { type JsonValue } from 'type-fest';
import { type Provider } from 'knifecycle';
import { type Transform, type Readable } from 'node:stream';
import { type WhookHTTPTransactionService } from './httpTransaction.js';
import {
  pathItemToOperationMap,
  ensureResolvedObject,
  type OpenAPIExtension,
  type OpenAPIReference,
  type OpenAPIResponse,
  PATH_ITEM_METHODS,
} from 'ya-open-api-types';
import { type LogService } from 'common-services';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import { type WhookErrorHandler } from '../services/errorHandler.js';
import { type AppEnvVars } from 'application-services';
import {
  type WhookRouteHandlerParameters,
  type WhookRouteHandler,
} from '../types/routes.js';
import { type WhookRequestBody, type WhookResponse } from '../types/http.js';
import { type WhookSchemaValidatorsService } from './schemaValidators.js';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  type WhookOpenAPIOperation,
  type WhookOpenAPI,
  type WhookSupportedParameter,
} from '../types/openapi.js';
import {
  type WhookQueryParser,
  type WhookQueryParserBuilderService,
} from './queryParserBuilder.js';
import { type WhookDefinitions } from './DEFINITIONS.js';

export const SEARCH_SEPARATOR = '?';
export const PATH_SEPARATOR = '/';

function noop() {
  return undefined;
}
function identity<T>(x: T): T {
  return x;
}

export type WhookHandlersService = Record<string, WhookRouteHandler>;
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
  COERCION_OPTIONS?: WhookCoercionOptions;
};
export type WhookHTTPRouterDependencies = WhookHTTPRouterConfig & {
  ENV: AppEnvVars;
  ROUTES_HANDLERS: WhookHandlersService;
  API: WhookOpenAPI;
  DEFINITIONS: WhookDefinitions;
  PARSERS?: WhookParsers;
  STRINGIFYERS?: WhookStringifyers;
  DECODERS?: WhookEncoders<Transform>;
  ENCODERS?: WhookDecoders<Transform>;
  queryParserBuilder: WhookQueryParserBuilderService;
  log?: LogService;
  schemaValidators: WhookSchemaValidatorsService;
  httpTransaction: WhookHTTPTransactionService;
  errorHandler: WhookErrorHandler;
};
export interface WhookHTTPRouterService {
  (req: IncomingMessage, res: ServerResponse): Promise<void>;
}
export type WhookHTTPRouterProvider = Provider<WhookHTTPRouterService>;

export type WhookHTTPRouterDescriptor = {
  handler: WhookRouteHandler;
  operation: WhookOpenAPIOperation;
  queryParser: WhookQueryParser;
  parametersValidators: WhookParametersValidators;
  consumableMediaTypes: string[];
  produceableMediaTypes: string[];
  bodyValidator: WhookBodyValidator;
};

/* Architecture Note #2.11: HTTP Router

The Whook's `httpRouter` service  is responsible
 for wiring routes definitions to their actual
 implementation while filtering inputs and ensuring
 good outputs.

This is the default implementation of the Framework
 but it can be replaced or customized by setting your
 own configurations to replace the default ones
 (see the [API section](#API)).

The `httpRouter` service is responsible for handling
 the request, validating it and wiring the routes
 response to the actual HTTP response.

It is very opinionated and clearly diverges from the
 current standards based on a middlewares/plugins
 approach.

Here, the single source of truth is your API
 definition. No documentation, no route.
*/

export default location(
  initializer(
    {
      name: 'httpRouter',
      type: 'provider',
      inject: [
        'ENV',
        '?DEBUG_NODE_ENVS',
        '?BUFFER_LIMIT',
        '?BASE_PATH',
        'ROUTES_HANDLERS',
        'API',
        'DEFINITIONS',
        '?PARSERS',
        '?STRINGIFYERS',
        '?DECODERS',
        '?ENCODERS',
        '?COERCION_OPTIONS',
        '?log',
        'schemaValidators',
        'httpTransaction',
        'errorHandler',
        'queryParserBuilder',
      ],
    },
    initHTTPRouter,
  ),
  import.meta.url,
);

/**
 * Initialize an HTTP router
 * @param  {Object}   services
 * The services the server depends on
 * @param  {String}   [services.BUFFER_LIMIT]
 * The maximum bufferisation before parsing the
 *  request body
 * @param  {String}   [services.BASE_PATH]
 * API base path
 * @param  {Object}   services.ROUTES_HANDLERS
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
 * @param  {Object} [services.queryParserBuilder]
 * A query parser builder from OpenAPI parameters
 * @param  {Object} [services.COERCION_OPTIONS]
 * Options for type coercion of parameters values
 * @param  {Function} [services.log=noop]
 * A logging function
 * @param  {Function} services.httpTransaction
 * A function to create a new HTTP transaction
 * @return {Promise}
 * A promise of a function to handle HTTP requests.
 */
async function initHTTPRouter({
  BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
  BASE_PATH = '',
  ROUTES_HANDLERS,
  API,
  DEFINITIONS,
  PARSERS = DEFAULT_PARSERS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
  DECODERS = DEFAULT_DECODERS,
  ENCODERS = DEFAULT_ENCODERS,
  COERCION_OPTIONS = DEFAULT_COERCION_OPTIONS,
  queryParserBuilder,
  schemaValidators,
  log = noop,
  httpTransaction,
  errorHandler,
}: WhookHTTPRouterDependencies): Promise<WhookHTTPRouterProvider> {
  const bufferLimit =
    bytes.parse(BUFFER_LIMIT) || (bytes.parse(DEFAULT_BUFFER_LIMIT) as number);
  const consumableCharsets = Object.keys(DECODERS);
  const produceableCharsets = Object.keys(ENCODERS);
  const defaultResponseSpec = {
    contentTypes: Object.keys(STRINGIFYERS),
    charsets: produceableCharsets,
  };

  const routers = await _createRouters({
    API,
    DEFINITIONS,
    COERCION_OPTIONS,
    ROUTES_HANDLERS,
    BASE_PATH,
    queryParserBuilder,
    schemaValidators,
    log,
  });

  let handleFatalError: (reason?: unknown) => void;
  const fatalErrorPromise: Promise<void> = new Promise((_resolve, reject) => {
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
      let operation: WhookOpenAPIOperation;
      let responseSpec = defaultResponseSpec;

      const { request, transaction } = await httpTransaction(req, res);

      await transaction
        .start(async () => {
          const method = request.method as (typeof PATH_ITEM_METHODS)[number];
          const path = request.url.split(SEARCH_SEPARATOR)[0];
          const parts = path.split(PATH_SEPARATOR).filter(identity);
          let [result, pathNodesValues] = routers[method]
            ? routers[method].find(parts)
            : [];

          // Second chance for HEAD calls
          if (!result && 'head' === method) {
            [result, pathNodesValues] = routers.get
              ? routers.get.find(parts)
              : [];
          }

          if (!result || !result.handler) {
            log('debug', '❌ - No handler found for: ', method, parts);
            throw new YHTTPError(
              404,
              'E_NOT_FOUND',
              method,
              parts,
              PATH_SEPARATOR + parts.join(PATH_SEPARATOR),
            );
          }

          const {
            handler,
            operation: _operation_,
            queryParser,
            parametersValidators,
            consumableMediaTypes,
            produceableMediaTypes,
            bodyValidator,
          } = result;

          operation = _operation_;

          const search = request.url.substr(
            request.url.split(SEARCH_SEPARATOR)[0].length,
          );

          const parametersValues: WhookRouteHandlerParameters = {
            query: {},
            header: {},
            path: {},
            cookie: {},
            body: undefined as unknown as WhookRequestBody,
            options: {},
          };

          try {
            const queryValues = queryParser(search);

            for (const location of Object.keys(parametersValidators)) {
              if (location === 'query') {
                for (const [name, validator] of Object.entries(
                  parametersValidators.query,
                )) {
                  parametersValues.query[name] = validator(
                    typeof queryValues[name] !== 'undefined'
                      ? queryValues[name]?.toString()
                      : undefined,
                  );
                }
              } else if (location === 'header') {
                for (const [name, validator] of Object.entries(
                  parametersValidators.header,
                )) {
                  // header names are case insensitive
                  const canonicalName = name.toLowerCase();

                  parametersValues.header[name] = validator(
                    typeof request.headers[canonicalName] !== 'undefined'
                      ? request.headers[canonicalName].toString()
                      : undefined,
                  );
                }
              } else if (location === 'path') {
                for (const [name, validator] of Object.entries(
                  parametersValidators.path,
                )) {
                  parametersValues.path[name] = validator(
                    pathNodesValues &&
                      typeof pathNodesValues[name] !== 'undefined'
                      ? pathNodesValues[name].toString()
                      : undefined,
                  );
                }
              }
            }

            const bodySpec = extractBodySpec(
              request,
              consumableMediaTypes || [],
              consumableCharsets,
            );

            responseSpec = extractResponseSpec(
              operation,
              request,
              produceableMediaTypes || [],
              produceableCharsets,
            );

            const body = await getBody(
              {
                API,
                DECODERS,
                PARSERS,
                bufferLimit,
              },
              operation,
              request.body as Readable,
              bodySpec,
            );

            bodyValidator(operation, bodySpec.contentType, body);

            if (typeof body !== 'undefined') {
              parametersValues.body = body;
            }
          } catch (err) {
            throw YHTTPError.cast(err as Error, 400);
          }

          const response = await executeHandler(
            {
              path,
              method,
              operation: operation as WhookOpenAPIOperation & OpenAPIExtension,
            },
            handler,
            parametersValues,
          );

          response.headers = response.headers || {};

          if (response.body) {
            response.headers['content-type'] =
              response.headers['content-type'] || responseSpec.contentTypes[0];
          }

          const responseContentType =
            pickFirstHeaderValue('content-type', response.headers || {}) ||
            'text/plain';

          const responseObject =
            operation.responses && operation.responses[response.status]
              ? await ensureResolvedObject(
                  API,
                  operation.responses[response.status] as
                    | OpenAPIResponse<ExpressiveJSONSchema, OpenAPIExtension>
                    | OpenAPIReference<
                        OpenAPIResponse<ExpressiveJSONSchema, OpenAPIExtension>
                      >,
                )
              : undefined;
          const responseSchema =
            responseObject &&
            responseObject.content &&
            responseObject.content?.[responseContentType] &&
            'schema' in responseObject.content[responseContentType] &&
            ((await ensureResolvedObject(
              API,
              responseObject.content?.[responseContentType].schema,
            )) as ExpressiveJSONSchema);

          // Check the stringifyer only when a schema is
          // specified and it is not a binary one
          const responseHasSchema =
            typeof responseSchema === 'boolean' ||
            (typeof responseSchema === 'object' &&
              responseSchema &&
              !(
                'type' in responseSchema &&
                responseSchema.type === 'string' &&
                responseSchema.format === 'binary'
              ));

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

async function buildPathNodes(
  {
    API,
    schemaValidators,
  }: {
    API: WhookOpenAPI;
    schemaValidators: WhookSchemaValidatorsService;
  },
  path: string,
  parameters: WhookSupportedParameter[],
) {
  const pathNodes: Parameters<Siso['register']>[0] = [];

  for (const node of path.split(PATH_SEPARATOR).filter(identity)) {
    const matches = /^{([a-z0-9]+)}$/i.exec(node);

    if (!matches) {
      pathNodes.push(node);
      continue;
    }

    const parameter = (parameters || []).find(
      (aParameter) =>
        aParameter.in === 'path' && aParameter.name === matches[1],
    );

    if (!parameter) {
      throw new YError('E_UNDECLARED_PATH_PARAMETER', path, node);
    }

    if (!('schema' in parameter) || typeof parameter.schema !== 'object') {
      throw new YError('E_UNSUPPORTED_PATH_PARAMETER', path, node);
    }

    const schema = (await ensureResolvedObject(
      API,
      parameter.schema,
    )) as ExpressiveJSONSchema;

    if (
      !('type' in schema) ||
      typeof schema.type !== 'string' ||
      !['number', 'string', 'boolean'].includes(schema.type)
    ) {
      throw new YError('E_UNSUPPORTED_PATH_PARAMETER', path, node);
    }

    pathNodes.push({
      type: schema.type as 'string',
      name: parameter.name,
      validate: schemaValidators(parameter.schema),
    });
  }
  return pathNodes;
}

async function _createRouters({
  API,
  DEFINITIONS,
  ROUTES_HANDLERS,
  BASE_PATH = '',
  COERCION_OPTIONS,
  queryParserBuilder,
  schemaValidators,
  log,
}: {
  API: WhookOpenAPI;
  DEFINITIONS: WhookDefinitions;
  ROUTES_HANDLERS: WhookHandlersService;
  BASE_PATH?: string;
  COERCION_OPTIONS: WhookCoercionOptions;
  queryParserBuilder: WhookQueryParserBuilderService;
  schemaValidators: WhookSchemaValidatorsService;
  log: LogService;
}) {
  const routers: Record<string, Siso<WhookHTTPRouterDescriptor>> = {};

  for (const [path, pathItem] of Object.entries(API.paths || {})) {
    const pathItemParameters = await resolveParameters(
      { API, log },
      pathItem.parameters || [],
    );
    const pathItemValidators = await createParametersValidators(
      {
        API,
        COERCION_OPTIONS,
        schemaValidators,
      },
      pathItemParameters,
    );

    for (const [method, operation] of Object.entries(
      pathItemToOperationMap(pathItem) as Record<string, WhookOpenAPIOperation>,
    )) {
      const operationId = operation.operationId;

      if (!path.startsWith(PATH_SEPARATOR)) {
        throw new YError('E_BAD_PATH', path);
      }

      if (!operationId) {
        throw new YError('E_NO_OPERATION_ID', path, method);
      }

      const targetHandler =
        DEFINITIONS.configs?.[operationId]?.type === 'route' &&
        DEFINITIONS.configs[operationId].config?.targetHandler
          ? DEFINITIONS.configs[operationId].config.targetHandler
          : operationId;
      const handler = ROUTES_HANDLERS[targetHandler];

      if (!handler) {
        throw new YError('E_NO_HANDLER', targetHandler);
      }

      const operationParameters = await resolveParameters(
        { API, log },
        operation.parameters || [],
      );
      const ammendedParameters = await resolveParameters(
        { API, log },
        await extractOperationSecurityParameters({ API }, operation),
      );
      const operationValidators = await createParametersValidators(
        {
          API,
          COERCION_OPTIONS,
          schemaValidators,
        },
        operationParameters.concat(ammendedParameters),
      );
      const bodyValidator = await prepareBodyValidator(
        { API, schemaValidators },
        operation,
      );

      const consumableMediaTypes = await extractConsumableMediaTypes(
        API,
        operation,
      );
      const produceableMediaTypes = await extractProduceableMediaTypes(
        API,
        operation,
      );
      const parameters = pathItemParameters
        .concat(ammendedParameters)
        .filter((parameter) =>
          operationParameters.every(
            (aParameter) =>
              aParameter.in !== parameter.in ||
              aParameter.name !== parameter.name,
          ),
        )
        .concat(operationParameters);
      const queryParser = await queryParserBuilder(parameters);

      routers[method] = routers[method] || new Siso();
      routers[method].register(
        await buildPathNodes(
          { API, schemaValidators },
          BASE_PATH + path,
          pathItemParameters.concat(operationParameters),
        ),
        {
          handler,
          operation,
          queryParser,
          parametersValidators: {
            path: {
              ...pathItemValidators.path,
              ...operationValidators.path,
            },
            query: {
              ...pathItemValidators.query,
              ...operationValidators.query,
            },
            header: {
              ...pathItemValidators.header,
              ...operationValidators.header,
            },
            cookie: {
              ...pathItemValidators.cookie,
              ...operationValidators.cookie,
            },
          },
          consumableMediaTypes,
          produceableMediaTypes,
          bodyValidator,
        },
      );
    }
  }

  return routers;
}
