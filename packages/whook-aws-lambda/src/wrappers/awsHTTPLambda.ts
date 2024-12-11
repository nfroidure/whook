import { autoService } from 'knifecycle';
import Ajv from 'ajv';
import addAJVFormats from 'ajv-formats';
import bytes from 'bytes';
import { YHTTPError } from 'yhttperror';
import { printStackTrace, YError } from 'yerror';
import {
  DEFAULT_DEBUG_NODE_ENVS,
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_PARSERS,
  DEFAULT_STRINGIFYERS,
  DEFAULT_DECODERS,
  DEFAULT_ENCODERS,
  extractOperationSecurityParameters,
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
  pickAllHeaderValues,
  noop,
  lowerCaseHeaders,
  type WhookRequest,
  type WhookResponse,
  type WhookHandler,
  type WhookObfuscatorService,
  type WhookOperation,
  type WhookAPMService,
  type DereferencedParameterObject,
  type WhookWrapper,
  type WhookErrorHandler,
} from '@whook/whook';
import stream from 'node:stream';
import qs from 'qs';
import { type Parameters } from 'knifecycle';
import { type TimeService, type LogService } from 'common-services';
import { type OpenAPIV3_1 } from 'openapi-types';
import { type Readable } from 'node:stream';
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from 'aws-lambda';
import { type AppEnvVars } from 'application-services';

export type LambdaHTTPInput = Parameters;
export type LambdaHTTPOutput = WhookResponse;

const SEARCH_SEPARATOR = '?';
const uuidPattern =
  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

export type WhookWrapConsumerLambdaDependencies = {
  OPERATION_API: OpenAPIV3_1.Document;
  ENV: AppEnvVars;
  DEBUG_NODE_ENVS?: string[];
  DECODERS?: typeof DEFAULT_DECODERS;
  ENCODERS?: typeof DEFAULT_ENCODERS;
  PARSED_HEADERS?: string[];
  PARSERS?: typeof DEFAULT_PARSERS;
  STRINGIFYERS?: typeof DEFAULT_STRINGIFYERS;
  BUFFER_LIMIT?: string;
  apm: WhookAPMService;
  obfuscator: WhookObfuscatorService;
  errorHandler: WhookErrorHandler;
  time?: TimeService;
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
 * @param  {Object}   services.DEBUG_NODE_ENVS
 * The NODE_ENV values that trigger debugging
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

async function initWrapHandlerForConsumerLambda<S extends WhookHandler>({
  OPERATION_API,
  ENV,
  DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
  DECODERS = DEFAULT_DECODERS,
  ENCODERS = DEFAULT_ENCODERS,
  PARSERS = DEFAULT_PARSERS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
  BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
  PARSED_HEADERS = [],
  apm,
  obfuscator,
  errorHandler,
  log = noop,
  time = Date.now.bind(Date),
}: WhookWrapConsumerLambdaDependencies): Promise<WhookWrapper<S>> {
  log('debug', '📥 - Initializing the AWS LAmbda consumer wrapper.');

  const path = Object.keys(OPERATION_API.paths || {})[0];
  const pathObject = OPERATION_API.paths?.[path];

  if (typeof pathObject === 'undefined' || '$ref' in pathObject) {
    throw new YError('E_BAD_OPERATION', 'pathObject', pathObject);
  }

  const method = Object.keys(pathObject)[0];
  const operationObject = pathObject[method];

  if (typeof operationObject === 'undefined' || '$ref' in operationObject) {
    throw new YError('E_BAD_OPERATION', 'operationObject', operationObject);
  }

  const operation: WhookOperation = {
    path,
    method,
    ...operationObject,
  };
  const consumableCharsets = Object.keys(DECODERS);
  const produceableCharsets = Object.keys(ENCODERS);
  const consumableMediaTypes = extractConsumableMediaTypes(operation);
  const produceableMediaTypes = extractProduceableMediaTypes(operation);
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
  const ammendedParameters = extractOperationSecurityParameters(
    OPERATION_API,
    operation,
  );
  const validators = prepareParametersValidators(
    ajv,
    operation.operationId,
    ((operation.parameters || []) as DereferencedParameterObject[]).concat(
      ammendedParameters,
    ),
  );
  const bodyValidator = prepareBodyValidator(ajv, operation);

  const wrapper = async (handler: S): Promise<S> => {
    const wrappedHandler = handleForAWSHTTPLambda.bind(
      null,
      {
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
        consumableMediaTypes,
        produceableMediaTypes,
        consumableCharsets,
        produceableCharsets,
        validators,
        bodyValidator,
        ammendedParameters,
        operation,
      },
      handler,
    );

    return wrappedHandler as unknown as S;
  };

  return wrapper;
}

async function handleForAWSHTTPLambda(
  {
    ENV,
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
    'OPERATION_API' | 'DEBUG_NODE_ENVS'
  >,
  {
    consumableMediaTypes,
    produceableMediaTypes,
    consumableCharsets,
    produceableCharsets,
    validators,
    bodyValidator,
    ammendedParameters,
    operation,
  }: {
    consumableMediaTypes: string[];
    produceableMediaTypes: string[];
    consumableCharsets: string[];
    produceableCharsets: string[];
    validators: {
      [name: string]: Ajv.ValidateFunction<unknown>;
    };
    bodyValidator: (
      operation: WhookOperation,
      contentType: string,
      value: unknown,
    ) => void;
    ammendedParameters: DereferencedParameterObject[];
    operation: WhookOperation;
  },
  handler: WhookHandler<LambdaHTTPInput, LambdaHTTPOutput>,
  event: APIGatewayProxyEvent,
) {
  const startTime = time();
  const bufferLimit =
    bytes.parse(BUFFER_LIMIT) || (bytes.parse(DEFAULT_BUFFER_LIMIT) as number);
  const operationParameters = (operation.parameters || []).concat(
    ammendedParameters,
  );

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
  let parameters;
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

  try {
    const bodySpec = extractBodySpec(
      request,
      consumableMediaTypes,
      consumableCharsets,
    );

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
        request.body as Readable,
        bodySpec,
      );

      parameters = {
        ...(event.pathParameters || {}),
        ...filterQueryParameters(
          operationParameters,
          (event.multiValueQueryStringParameters || {}) as Record<
            string,
            string[]
          >,
        ),
        ...filterHeaders(operationParameters, request.headers),
      };

      parameters = {
        // TODO: Use the security of the operation to infer
        // authorization parameters, see:
        // https://github.com/nfroidure/whook/blob/06ccae93d1d52d97ff70fd5e19fa826bdabf3968/packages/whook-http-router/src/validation.js#L110
        authorization: parameters.authorization,
        ...castParameters(operationParameters, parameters),
      };

      applyValidators(operation, validators, parameters);

      bodyValidator(operation, bodySpec.contentType, body);

      parameters = {
        ...parameters,
        ...('undefined' !== typeof body ? { body } : {}),
      };
    } catch (err) {
      throw YHTTPError.cast(err as Error, 400);
    }

    response = await executeHandler(operation, handler, parameters);

    if (response.body) {
      response.headers['content-type'] =
        response.headers['content-type'] || responseSpec.contentTypes[0];
    }

    // Check the stringifyer only when a schema is
    // specified and it is not a binary one
    const responseObject =
      operation.responses &&
      (operation.responses[response.status] as OpenAPIV3_1.ResponseObject);
    const responseSchema =
      responseObject &&
      responseObject.content &&
      responseObject.content[response.headers['content-type']] &&
      (responseObject.content[response.headers['content-type']]
        .schema as OpenAPIV3_1.SchemaObject);
    const responseHasSchema =
      responseSchema &&
      (responseSchema.type !== 'string' || responseSchema.format !== 'binary');

    if (responseHasSchema && !STRINGIFYERS[response.headers['content-type']]) {
      throw new YHTTPError(
        500,
        'E_STRINGIFYER_LACK',
        response.headers['content-type'],
      );
    }
    if (response.body) {
      checkResponseMediaType(request, responseSpec, produceableMediaTypes);
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
    parameters: obfuscator.obfuscateSensibleProps(parameters),
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

function filterQueryParameters(
  parameters: DereferencedParameterObject[],
  queryParameters: { [name: string]: string[] },
): { [name: string]: string } {
  return (parameters || [])
    .filter((parameter) => 'query' === parameter.in)
    .reduce((filteredHeaders, parameter) => {
      if (queryParameters[parameter.name]) {
        if (parameter.schema.type === 'array') {
          filteredHeaders[parameter.name] = queryParameters[parameter.name];
        } else {
          filteredHeaders[parameter.name] = queryParameters[parameter.name][0];
        }
      }
      return filteredHeaders;
    }, {});
}

export default autoService(initWrapHandlerForConsumerLambda);
