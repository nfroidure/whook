import { YError, printStackTrace } from 'yerror';
import stream, { type Readable } from 'node:stream';
import { autoService } from 'knifecycle';
import bytes from 'bytes';
import { YHTTPError } from 'yhttperror';
import {
  DEFAULT_COERCION_OPTIONS,
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_PARSERS,
  DEFAULT_STRINGIFIERS,
  DEFAULT_DECODERS,
  DEFAULT_ENCODERS,
  SEARCH_SEPARATOR,
  PATH_SEPARATOR,
  extractOperationSecurityParameters,
  prepareBodyValidator,
  extractBodySpec,
  extractResponseSpec,
  checkResponseCharset,
  checkResponseMediaType,
  executeHandler,
  extractProduceableMediaTypes,
  extractConsumableMediaTypes,
  getBody,
  sendBody,
  noop,
  identity,
  lowerCaseHeaders,
  resolveParameters,
  createParametersValidators,
  pickFirstHeaderValue,
  type WhookRequest,
  type WhookResponse,
  type WhookRouteHandler,
  type WhookObfuscatorService,
  type WhookRouteHandlerWrapper,
  type WhookErrorHandler,
  type WhookOpenAPI,
  type WhookCoercionOptions,
  type WhookRouteDefinition,
  type WhookRequestBody,
  type WhookHTTPRouterDescriptor,
  type WhookSchemaValidatorsService,
  type WhookRouteHandlerParameters,
  type WhookQueryParserBuilderService,
} from '@whook/whook';
import { type LogService } from 'common-services';
import {
  ensureResolvedObject,
  type OpenAPIReference,
  type OpenAPIExtension,
  type OpenAPIResponse,
} from 'ya-open-api-types';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';

export type WhookGCPFunctionRouteWrapperDependencies = {
  MAIN_DEFINITION: WhookRouteDefinition;
  MAIN_API: WhookOpenAPI;
  DECODERS?: typeof DEFAULT_DECODERS;
  ENCODERS?: typeof DEFAULT_ENCODERS;
  PARSERS?: typeof DEFAULT_PARSERS;
  STRINGIFIERS?: typeof DEFAULT_STRINGIFIERS;
  queryParserBuilder: WhookQueryParserBuilderService;
  BUFFER_LIMIT?: string;
  COERCION_OPTIONS: WhookCoercionOptions;
  obfuscator: WhookObfuscatorService;
  errorHandler: WhookErrorHandler;
  schemaValidators: WhookSchemaValidatorsService;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with GCP Functions.
 * @param  {Object}   services
 * The services the wrapper depends on
 * @param  {Object}   services.MAIN_DEFINITION
 * An OpenAPI definitition for that handler
 * @param  {Object}   services.DECODERS
 * Request body decoders available
 * @param  {Object}   services.ENCODERS
 * Response body encoders available
 * @param  {Object}   services.PARSERS
 * Request body parsers available
 * @param  {Object}   services.STRINGIFIERS
 * Response body stringifiers available
 * @param  {Object}   services.BUFFER_LIMIT
 * The buffer size limit
 * @param  {Object} services.queryParserBuilder
 * A query parser builder from OpenAPI parameters
 * @param  {Object}   services.obfuscator
 * A service to hide sensible values
 * @param  {Object}   services.errorHandler
 * A service that changes any error to Whook response
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */

async function initWrapRouteHandlerForGoogleHTTPFunction({
  MAIN_DEFINITION,
  MAIN_API,
  DECODERS = DEFAULT_DECODERS,
  ENCODERS = DEFAULT_ENCODERS,
  PARSERS = DEFAULT_PARSERS,
  STRINGIFIERS = DEFAULT_STRINGIFIERS,
  BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
  queryParserBuilder,
  COERCION_OPTIONS = DEFAULT_COERCION_OPTIONS,
  obfuscator,
  errorHandler,
  schemaValidators,
  log = noop,
}: WhookGCPFunctionRouteWrapperDependencies): Promise<
  WhookRouteHandlerWrapper<WhookRouteHandler>
> {
  log('debug', '📥 - Initializing the GCP Function wrapper.');

  const path = MAIN_DEFINITION.path;
  const pathItem = MAIN_API.paths?.[path];

  if (typeof pathItem === 'undefined' || '$ref' in pathItem) {
    throw new YError('E_BAD_OPERATION', 'pathItem', pathItem);
  }

  const method = MAIN_DEFINITION.method;
  const operation = pathItem[method];

  if (typeof operation === 'undefined' || '$ref' in operation) {
    throw new YError('E_BAD_OPERATION', 'operation', operation);
  }

  const pathItemParameters = await resolveParameters(
    { API: MAIN_API, log },
    pathItem.parameters || [],
  );
  const pathItemValidators = await createParametersValidators(
    {
      API: MAIN_API,
      COERCION_OPTIONS,
      schemaValidators,
    },
    pathItemParameters,
  );

  const operationParameters = await resolveParameters(
    { API: MAIN_API, log },
    operation.parameters || [],
  );
  const ammendedParameters = await resolveParameters(
    { API: MAIN_API, log },
    await extractOperationSecurityParameters({ API: MAIN_API }, operation),
  );
  const operationValidators = await createParametersValidators(
    {
      API: MAIN_API,
      COERCION_OPTIONS,
      schemaValidators,
    },
    operationParameters.concat(ammendedParameters),
  );
  const bodyValidator = await prepareBodyValidator(
    { API: MAIN_API, schemaValidators },
    operation,
  );
  const consumableCharsets = Object.keys(DECODERS);
  const produceableCharsets = Object.keys(ENCODERS);
  const consumableMediaTypes = await extractConsumableMediaTypes(
    MAIN_API,
    operation,
  );
  const produceableMediaTypes = await extractProduceableMediaTypes(
    MAIN_API,
    operation,
  );
  const parameters = pathItemParameters
    .concat(ammendedParameters)
    .filter((parameter) =>
      operationParameters.every(
        (aParameter) =>
          aParameter.in !== parameter.in || aParameter.name !== parameter.name,
      ),
    )
    .concat(operationParameters);
  const queryParser = await queryParserBuilder(parameters);
  const wrapper = async (
    handler: WhookRouteHandler,
  ): Promise<WhookRouteHandler> => {
    const wrappedHandler = handleForAWSHTTPFunction.bind(
      null,
      {
        MAIN_DEFINITION,
        MAIN_API,
        DECODERS,
        ENCODERS,
        PARSERS,
        STRINGIFIERS,
        BUFFER_LIMIT,
        obfuscator,
        errorHandler,
        log,
      },
      {
        consumableCharsets,
        produceableCharsets,
        handler,
        operation,
        config: MAIN_DEFINITION.config || {},
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
      MAIN_DEFINITION,
    );

    return wrappedHandler as unknown as WhookRouteHandler;
  };

  return wrapper;
}

async function handleForAWSHTTPFunction(
  {
    MAIN_API,
    DECODERS,
    ENCODERS,
    PARSERS,
    STRINGIFIERS,
    BUFFER_LIMIT,
    obfuscator,
    errorHandler,
    log,
  }: Omit<
    Required<WhookGCPFunctionRouteWrapperDependencies>,
    'COERCION_OPTIONS' | 'schemaValidators' | 'queryParserBuilder'
  >,
  {
    handler,
    operation,
    parametersValidators,
    consumableMediaTypes,
    produceableMediaTypes,
    consumableCharsets,
    produceableCharsets,
    queryParser,
    bodyValidator,
  }: WhookHTTPRouterDescriptor & {
    consumableCharsets: string[];
    produceableCharsets: string[];
  },
  definition: WhookRouteDefinition,
  req,
  res,
) {
  const bufferLimit =
    bytes.parse(BUFFER_LIMIT) || (bytes.parse(DEFAULT_BUFFER_LIMIT) as number);

  log?.(
    'info',
    'GCP_FUNCTIONS_REQUEST',
    JSON.stringify({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      // body: obfuscateEventBody(obfuscator, req.body),
      headers: obfuscator.obfuscateSensibleHeaders(req.headers || {}),
    }),
  );

  const request = await gcpfReqToRequest(req);
  let response;
  let responseLog;
  let responseSpec;

  log?.(
    'debug',
    'REQUEST',
    JSON.stringify({
      ...request,
      body: request.body ? 'Stream' : undefined,
      headers: obfuscator.obfuscateSensibleHeaders(request.headers),
    }),
  );

  const parametersValues: WhookRouteHandlerParameters = {
    query: {},
    headers: {},
    path: {},
    cookies: {},
    body: undefined as unknown as WhookRequestBody,
  };

  try {
    try {
      const path = request.url.split(SEARCH_SEPARATOR)[0];
      const parts = path.split(PATH_SEPARATOR).filter(identity);
      const search = request.url.substr(
        request.url.split(SEARCH_SEPARATOR)[0].length,
      );
      const queryValues = queryParser(search);
      const pathParameters = (
        definition.path
          .split(PATH_SEPARATOR)
          .filter(identity)
          .map((part, index) => {
            const matches = /^\{([\d\w]+)\}$/i.exec(part);

            if (matches) {
              return {
                name: matches[1],
                value: parts[index],
              };
            }
          }) as Array<{ name: string; value: string }>
      )
        .filter(identity)
        .reduce(
          (accParameters, { name, value }) => ({
            ...accParameters,
            [name]: value,
          }),
          {},
        );

      for (const location of Object.keys(parametersValidators)) {
        if (location === 'query') {
          for (const [name, validator] of Object.entries(
            parametersValidators.query,
          )) {
            parametersValues.query[name] = validator(
              queryValues && typeof queryValues[name] !== 'undefined'
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

            parametersValues.headers[name] = validator(
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
              pathParameters && typeof pathParameters[name] !== 'undefined'
                ? pathParameters[name].toString()
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
          API: MAIN_API,
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

    response = await executeHandler(definition, handler, parametersValues);

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
            MAIN_API,
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
        MAIN_API,
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

    if (responseHasSchema && !STRINGIFIERS[responseContentType]) {
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
    responseLog = {
      type: 'success',
      status: response.status,
    };
    log?.('debug', JSON.stringify(responseLog));
  } catch (err) {
    response = await errorHandler('none', responseSpec, err as Error);
    responseLog = {
      type: 'error',
      code: (err as YError)?.code || 'E_UNEXPECTED',
      statusCode: response.status,
      params: (err as YError)?.params || [],
      stack: printStackTrace(err as Error),
    };

    log?.('error', JSON.stringify(responseLog));

    response = {
      ...response,
      headers: {
        ...response.headers,
        'content-type': 'application/json',
      },
    };
  }

  log?.(
    'debug',
    'RESPONSE',
    JSON.stringify({
      ...response,
      body: obfuscateEventBody(obfuscator, response.body),
      headers: obfuscator.obfuscateSensibleHeaders(response.headers),
    }),
  );

  await pipeResponseInGCPFResponse(
    await sendBody(
      {
        ENCODERS,
        STRINGIFIERS,
      },
      response,
    ),
    res,
  );
}

async function gcpfReqToRequest(req): Promise<WhookRequest> {
  const request: WhookRequest = {
    method: req.method.toLowerCase(),
    headers: lowerCaseHeaders(req.headers || {}),
    url: req.originalUrl,
  };

  if (req.rawBody) {
    request.headers['content-length'] = req.rawBody.length.toString();
    const bodyStream = new stream.PassThrough();

    request.body = bodyStream;
    bodyStream.write(req.rawBody);
    bodyStream.end();
  }

  return request;
}

async function pipeResponseInGCPFResponse(
  response: WhookResponse,
  res,
): Promise<void> {
  Object.keys(response.headers || {}).forEach((headerName) => {
    res.set(headerName, response.headers?.[headerName]);
  });
  res.status(response.status);

  if (response.body) {
    (response.body as Readable).pipe(res);
    return;
  }

  res.end();
}

function obfuscateEventBody(obfuscator, rawBody) {
  if (typeof rawBody === 'string') {
    try {
      const jsonBody = JSON.parse(rawBody);

      return JSON.stringify(obfuscator.obfuscateSensibleProps(jsonBody));
      // eslint-disable-next-line
    } catch (err) {}
  }
  return rawBody;
}

export default autoService(initWrapRouteHandlerForGoogleHTTPFunction);
