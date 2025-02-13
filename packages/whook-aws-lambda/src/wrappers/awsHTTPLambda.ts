import { autoService } from 'knifecycle';
import bytes from 'bytes';
import { YHTTPError } from 'yhttperror';
import { printStackTrace, YError } from 'yerror';
import {
  SEARCH_SEPARATOR,
  DEFAULT_COERCION_OPTIONS,
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_PARSERS,
  DEFAULT_STRINGIFYERS,
  DEFAULT_DECODERS,
  DEFAULT_ENCODERS,
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
  pickAllHeaderValues,
  noop,
  lowerCaseHeaders,
  resolveParameters,
  createParametersValidators,
  pickFirstHeaderValue,
  type WhookRequest,
  type WhookResponse,
  type WhookAPIHandler,
  type WhookObfuscatorService,
  type WhookAPIHandlerDefinition,
  type WhookAPMService,
  type WhookAPIWrapper,
  type WhookErrorHandler,
  type WhookRequestBody,
  type WhookAPIHandlerParameters,
  type WhookOpenAPI,
  type WhookSchemaValidatorsService,
  type WhookCoercionOptions,
  type WhookHTTPRouterDescriptor,
} from '@whook/whook';
import stream from 'node:stream';
import qs from 'qs';
import { type TimeService, type LogService } from 'common-services';
import {
  PATH_ITEM_METHODS,
  ensureResolvedObject,
  type OpenAPIReference,
  type OpenAPIExtension,
  type OpenAPIResponse,
} from 'ya-open-api-types';
import { type Readable } from 'node:stream';
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from 'aws-lambda';
import { type AppEnvVars } from 'application-services';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import { type JsonValue } from 'type-fest';

export type LambdaHTTPInput = WhookAPIHandlerParameters;
export type LambdaHTTPOutput = WhookResponse;

const uuidPattern =
  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

export type WhookWrapConsumerLambdaDependencies = {
  OPERATION_API: WhookOpenAPI;
  ENV: AppEnvVars;
  DECODERS?: typeof DEFAULT_DECODERS;
  ENCODERS?: typeof DEFAULT_ENCODERS;
  PARSED_HEADERS?: string[];
  PARSERS?: typeof DEFAULT_PARSERS;
  STRINGIFYERS?: typeof DEFAULT_STRINGIFYERS;
  BUFFER_LIMIT?: string;
  COERCION_OPTIONS: WhookCoercionOptions;
  apm: WhookAPMService;
  obfuscator: WhookObfuscatorService;
  errorHandler: WhookErrorHandler;
  schemaValidators: WhookSchemaValidatorsService;
  time: TimeService;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with a consumer AWS Lambda.
 * @param  {Object}   services
 * The services the wrapper depends on
 * @param  {Object}   services.OPERATION_API
 * An OpenAPI definitition for that handler
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.DECODERS
 * Request body decoders available
 * @param  {Object}   services.ENCODERS
 * Response body encoders available
 * @param  {Object}   services.PARSED_HEADERS
 * A list of headers that should be parsed as JSON
 * @param  {Object}   services.PARSERS
 * Request body parsers available
 * @param  {Object}   services.STRINGIFYERS
 * Response body stringifyers available
 * @param  {Object}   services.BUFFER_LIMIT
 * The buffer size limit
 * @param  {Object}   services.apm
 * An application monitoring service
 * @param  {Object}   services.obfuscator
 * A service to hide sensible values
 * @param  {Object}   services.errorHandler
 * A service that changes any error to Whook response
 * @param  {Object}   [services.time]
 * An optional time service
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */

async function initWrapHandlerForConsumerLambda({
  OPERATION_API,
  ENV,
  DECODERS = DEFAULT_DECODERS,
  ENCODERS = DEFAULT_ENCODERS,
  PARSERS = DEFAULT_PARSERS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
  BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
  PARSED_HEADERS = [],
  COERCION_OPTIONS = DEFAULT_COERCION_OPTIONS,
  time,
  apm,
  obfuscator,
  errorHandler,
  schemaValidators,
  log = noop,
}: WhookWrapConsumerLambdaDependencies): Promise<WhookAPIWrapper> {
  log('debug', '📥 - Initializing the AWS Lambda consumer wrapper.');

  const consumableCharsets = Object.keys(DECODERS);
  const produceableCharsets = Object.keys(ENCODERS);
  const path = Object.keys(OPERATION_API.paths || {})[0];
  const pathItem = OPERATION_API.paths?.[path];

  if (typeof pathItem === 'undefined' || '$ref' in pathItem) {
    throw new YError('E_BAD_OPERATION', 'pathItem', pathItem);
  }

  const method = Object.keys(pathItem).filter((method) =>
    PATH_ITEM_METHODS.includes(method as (typeof PATH_ITEM_METHODS)[number]),
  )[0];
  const operation = pathItem[method];

  if (typeof operation === 'undefined' || '$ref' in operation) {
    throw new YError('E_BAD_OPERATION', 'operation', operation);
  }

  const definition = {
    path,
    method,
    operation,
    config: operation['x-whook'],
  } as unknown as WhookAPIHandlerDefinition;
  const pathItemParameters = await resolveParameters(
    { API: OPERATION_API, log },
    pathItem.parameters || [],
  );
  const pathItemValidators = await createParametersValidators(
    {
      API: OPERATION_API,
      COERCION_OPTIONS,
      schemaValidators,
    },
    pathItemParameters,
  );

  const operationParameters = await resolveParameters(
    { API: OPERATION_API, log },
    operation.parameters || [],
  );
  const ammendedParameters = await resolveParameters(
    { API: OPERATION_API, log },
    await extractOperationSecurityParameters({ API: OPERATION_API }, operation),
  );
  const operationValidators = await createParametersValidators(
    {
      API: OPERATION_API,
      COERCION_OPTIONS,
      schemaValidators,
    },
    operationParameters.concat(ammendedParameters),
  );
  const bodyValidator = await prepareBodyValidator(
    { API: OPERATION_API, schemaValidators },
    operation,
  );

  const consumableMediaTypes = await extractConsumableMediaTypes(
    OPERATION_API,
    operation,
  );
  const produceableMediaTypes = await extractProduceableMediaTypes(
    OPERATION_API,
    operation,
  );

  const wrapper = async (
    handler: WhookAPIHandler,
  ): Promise<WhookAPIHandler> => {
    const wrappedHandler = handleForAWSHTTPLambda.bind(
      null,
      {
        OPERATION_API,
        ENV,
        DECODERS,
        ENCODERS,
        PARSED_HEADERS,
        PARSERS,
        STRINGIFYERS,
        BUFFER_LIMIT,
        apm,
        obfuscator,
        errorHandler,
        log,
        time,
      },
      {
        handler,
        operation,
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
        consumableCharsets,
        produceableCharsets,
        bodyValidator,
      },
      definition,
    );

    return wrappedHandler as unknown as WhookAPIHandler;
  };

  return wrapper;
}

async function handleForAWSHTTPLambda(
  {
    ENV,
    OPERATION_API,
    DECODERS,
    ENCODERS,
    PARSED_HEADERS,
    PARSERS,
    STRINGIFYERS,
    BUFFER_LIMIT,
    apm,
    errorHandler,
    obfuscator,
    log,
    time,
  }: Omit<
    Required<WhookWrapConsumerLambdaDependencies>,
    'COERCION_OPTIONS' | 'schemaValidators'
  >,
  {
    handler,
    operation,
    parametersValidators,
    consumableMediaTypes,
    produceableMediaTypes,
    consumableCharsets,
    produceableCharsets,
    bodyValidator,
  }: Omit<WhookHTTPRouterDescriptor, 'queryParser'> & {
    consumableCharsets: string[];
    produceableCharsets: string[];
  },
  definition: WhookAPIHandlerDefinition,
  event: APIGatewayProxyEvent,
) {
  const startTime = time();
  const bufferLimit =
    bytes.parse(BUFFER_LIMIT) || (bytes.parse(DEFAULT_BUFFER_LIMIT) as number);

  log(
    'info',
    'AWS_REQUEST_EVENT',
    JSON.stringify({
      ...event,
      body: obfuscateEventBody(obfuscator, event.body),
      headers: obfuscator.obfuscateSensibleHeaders(
        event.headers as Record<string, string>,
      ),
      multiValueHeaders: obfuscator.obfuscateSensibleHeaders(
        event.multiValueHeaders as Record<string, string[]>,
      ),
    }),
  );

  const request = await awsRequestEventToRequest(event);
  let response;
  let responseLog;
  let responseSpec;

  log(
    'debug',
    'REQUEST',
    JSON.stringify({
      ...request,
      body: request.body ? 'Stream' : undefined,
      headers: obfuscator.obfuscateSensibleHeaders(request.headers),
    }),
  );

  const parametersValues: WhookAPIHandlerParameters = {
    query: {},
    header: {},
    path: {},
    cookie: {},
    body: undefined as unknown as WhookRequestBody,
    options: {},
  };

  try {
    try {
      for (const location of Object.keys(parametersValidators)) {
        if (location === 'query') {
          for (const [name, validator] of Object.entries(
            parametersValidators.query,
          )) {
            parametersValues.query[name] = validator(
              event.multiValueQueryStringParameters &&
                typeof event.multiValueQueryStringParameters[name] !==
                  'undefined'
                ? event.multiValueQueryStringParameters[name].toString()
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
              event.pathParameters &&
                typeof event.pathParameters[name] !== 'undefined'
                ? event.pathParameters[name].toString()
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
          API: OPERATION_API,
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
            OPERATION_API,
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
        OPERATION_API,
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
    responseLog = {
      type: 'success',
      status: response.status,
    };
    log('debug', JSON.stringify(responseLog));
  } catch (err) {
    response = await errorHandler(
      event.requestContext.requestId,
      responseSpec,
      err as Error,
    );

    responseLog = {
      type: 'error',
      code: (err as YError)?.code || 'E_UNEXPECTED',
      statusCode: response.status,
      params: (err as YError)?.params || [],
      stack: printStackTrace(err as Error),
    };

    log('error', JSON.stringify(responseLog));

    response = {
      ...response,
      headers: {
        ...response.headers,
        'content-type': 'application/json',
      },
    };
  }

  log(
    'debug',
    'RESPONSE',
    JSON.stringify({
      ...response,
      body: obfuscateEventBody(obfuscator, response.body),
      headers: obfuscator.obfuscateSensibleHeaders(response.headers),
    }),
  );

  const awsResponse = await responseToAWSResponseEvent(
    await sendBody(
      {
        ENCODERS,
        STRINGIFYERS,
      },
      response,
    ),
  );

  log(
    'debug',
    'AWS_RESPONSE_EVENT',
    JSON.stringify({
      ...awsResponse,
      body: obfuscateEventBody(obfuscator, awsResponse.body),
      headers: obfuscator.obfuscateSensibleHeaders(
        awsResponse.headers as Record<string, string>,
      ),
    }),
  );

  const transactionId =
    pickAllHeaderValues('x-transaction-id', request.headers).filter((value) =>
      new RegExp(uuidPattern).test(value),
    )[0] ||
    event.requestContext.requestId ||
    'no_id';

  apm('CALL', {
    id: event.requestContext.requestId,
    transactionId,
    environment: ENV.NODE_ENV,
    method: event.requestContext.httpMethod,
    resourcePath: event.requestContext.resourcePath,
    path: event.requestContext.path,
    userAgent:
      event.requestContext.identity && event.requestContext.identity.userAgent,
    triggerTime: event.requestContext.requestTimeEpoch,
    lambdaName: operation.operationId,
    parameters: obfuscator.obfuscateSensibleProps(
      parametersValues as JsonValue,
    ),
    status: response.status,
    headers: obfuscator.obfuscateSensibleHeaders(
      Object.keys(response.headers).reduce(
        (finalHeaders, headerName) => ({
          ...finalHeaders,
          ...((PARSED_HEADERS || []).includes(headerName)
            ? {}
            : {
                [headerName]: response.headers[headerName],
              }),
        }),
        {},
      ),
    ),
    bodyLength: awsResponse.body ? awsResponse.body.length : 0,
    type: responseLog.type,
    stack: responseLog.stack || 'no_stack',
    code: responseLog.code,
    params: responseLog.params,
    startTime,
    endTime: time(),
    ...(PARSED_HEADERS || []).reduce(
      (result, parsedHeader) => ({
        ...result,
        ...(response.headers[parsedHeader]
          ? JSON.parse(response.headers[parsedHeader])
          : {}),
      }),
      {},
    ),
  });

  return awsResponse;
}

async function awsRequestEventToRequest(
  event: APIGatewayProxyEvent,
): Promise<WhookRequest> {
  const queryStringParametersNames = Object.keys(
    event.multiValueQueryStringParameters || {},
  );
  const request: WhookRequest = {
    method: event.requestContext.httpMethod.toLowerCase(),
    headers: lowerCaseHeaders({
      ...event.headers,
      ...event.multiValueHeaders,
    }) as Record<string, string | string[]>,
    url:
      event.requestContext.path +
      (queryStringParametersNames.length
        ? SEARCH_SEPARATOR +
          qs.stringify(event.multiValueQueryStringParameters || {})
        : ''),
  };

  if (event.body) {
    const buf = Buffer.from(
      event.body,
      event.isBase64Encoded ? 'base64' : 'utf8',
    );
    const bodyStream = new stream.PassThrough();

    request.headers['content-length'] = buf.length.toString();
    request.body = bodyStream;
    bodyStream.write(buf);
    bodyStream.end();
  }

  return request;
}

async function responseToAWSResponseEvent(
  response: WhookResponse,
): Promise<APIGatewayProxyResult> {
  const amazonResponse: APIGatewayProxyResult = {
    statusCode: response.status,
    headers: Object.keys(response.headers || {}).reduce(
      (stringHeaders, name) => ({
        ...stringHeaders,
        ...(typeof response.headers?.[name] === 'string'
          ? {
              [name]: response.headers[name],
            }
          : {}),
      }),
      {},
    ),
    multiValueHeaders: Object.keys(response.headers || {}).reduce(
      (stringHeaders, name) => ({
        ...stringHeaders,
        ...(response.headers?.[name] instanceof Array
          ? {
              [name]: response.headers[name],
            }
          : {}),
      }),
      {},
    ),
    body: undefined as unknown as string,
  };

  if (response.body) {
    const stream = response.body as Readable;
    const buf: Buffer = await new Promise((resolve, reject) => {
      const chunks = [] as Buffer[];

      stream.once('end', () => resolve(Buffer.concat(chunks)));
      stream.once('error', reject);
      stream.on('readable', () => {
        let data;
        while ((data = stream.read())) {
          chunks.push(data);
        }
      });
    });
    if (
      response.headers?.['content-type'] &&
      ((response.headers['content-type'] as 'string').startsWith('image/') ||
        (response.headers['content-type'] as 'string').startsWith(
          'application/pdf',
        ))
    ) {
      amazonResponse.body = buf.toString('base64');
      amazonResponse.isBase64Encoded = true;
    } else {
      amazonResponse.body = buf.toString();
    }
  }

  return amazonResponse;
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

export default autoService(initWrapHandlerForConsumerLambda);
