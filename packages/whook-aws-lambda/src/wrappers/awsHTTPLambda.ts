import {
  DEFAULT_DEBUG_NODE_ENVS,
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_PARSERS,
  DEFAULT_STRINGIFYERS,
  DEFAULT_DECODERS,
  DEFAULT_ENCODERS,
  extractOperationSecurityParameters,
  castParameters,
} from '@whook/http-router';
import { reuseSpecialProps, alsoInject } from 'knifecycle';
import Ajv from 'ajv';
import addAJVFormats from 'ajv-formats';
import bytes from 'bytes';
import { YHTTPError } from 'yhttperror';
import { YError } from 'yerror';
import {
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
} from '@whook/http-router';
import stream from 'stream';
import qs from 'qs';
import { noop, compose, lowerCaseHeaders } from '@whook/whook';
import type {
  ServiceInitializer,
  Dependencies,
  Service,
  Parameters,
} from 'knifecycle';
import type {
  WhookRequest,
  WhookResponse,
  WhookHandler,
  ObfuscatorService,
  WhookOperation,
  APMService,
  WhookWrapper,
} from '@whook/whook';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { Readable } from 'stream';
import type { DereferencedParameterObject } from '@whook/http-transaction';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import type { CORSConfig } from '@whook/cors';
import type { WhookErrorHandler } from '@whook/http-router';

type HTTPWrapperDependencies = {
  NODE_ENV: string;
  DEBUG_NODE_ENVS?: string[];
  OPERATION: WhookOperation;
  DECODERS?: typeof DEFAULT_DECODERS;
  ENCODERS?: typeof DEFAULT_ENCODERS;
  PARSED_HEADERS?: string[];
  PARSERS?: typeof DEFAULT_PARSERS;
  STRINGIFYERS?: typeof DEFAULT_STRINGIFYERS;
  BUFFER_LIMIT?: string;
  apm: APMService;
  obfuscator: ObfuscatorService;
  errorHandler: WhookErrorHandler;
  time?: TimeService;
  log?: LogService;
  WRAPPERS: WhookWrapper<Dependencies, Service>[];
};

export type LambdaHTTPInput = Parameters;
export type LambdaHTTPOutput = WhookResponse;

const SEARCH_SEPARATOR = '?';
const uuidPattern =
  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

export default function wrapHandlerForAWSHTTPLambda<
  D extends Dependencies<any>,
  S extends WhookHandler,
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & HTTPWrapperDependencies, S> {
  return alsoInject<HTTPWrapperDependencies, D, S>(
    [
      'OPERATION_API',
      'WRAPPERS',
      '?DEBUG_NODE_ENVS',
      'NODE_ENV',
      '?DECODERS',
      '?ENCODERS',
      '?PARSED_HEADERS',
      '?PARSERS',
      '?STRINGIFYERS',
      '?BUFFER_LIMIT',
      'apm',
      'obfuscator',
      'errorHandler',
      '?log',
      '?time',
    ],
    reuseSpecialProps(
      initHandler,
      (initHandlerForAWSHTTPLambda as any).bind(
        null,
        initHandler,
      ) as ServiceInitializer<D, S>,
    ),
  );
}

async function initHandlerForAWSHTTPLambda(
  initHandler: ServiceInitializer<Dependencies<any>, WhookHandler>,
  {
    OPERATION_API,
    WRAPPERS,
    NODE_ENV,
    DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
    DECODERS = DEFAULT_DECODERS,
    ENCODERS = DEFAULT_ENCODERS,
    PARSED_HEADERS = [],
    log = noop,
    time = Date.now.bind(Date),
    ...services
  },
) {
  const path = Object.keys(OPERATION_API.paths)[0];
  const method = Object.keys(OPERATION_API.paths[path])[0];
  const OPERATION: WhookOperation = {
    path,
    method,
    ...OPERATION_API.paths[path][method],
  };
  const consumableCharsets = Object.keys(DECODERS);
  const produceableCharsets = Object.keys(ENCODERS);
  const consumableMediaTypes = extractConsumableMediaTypes(OPERATION);
  const produceableMediaTypes = extractProduceableMediaTypes(OPERATION);
  const ajv = new Ajv.default({
    verbose: DEBUG_NODE_ENVS.includes(NODE_ENV),
    strict: true,
    logger: {
      log: (...args) => log('debug', ...args),
      warn: (...args) => log('warning', ...args),
      error: (...args) => log('error', ...args),
    },
    useDefaults: true,
    coerceTypes: true,
  });
  addAJVFormats.default(ajv);
  const ammendedParameters = extractOperationSecurityParameters(
    OPERATION_API,
    OPERATION,
  );
  const validators = prepareParametersValidators(
    ajv,
    OPERATION.operationId,
    ((OPERATION.parameters || []) as OpenAPIV3.ParameterObject[]).concat(
      ammendedParameters,
    ),
  );
  const bodyValidator = prepareBodyValidator(ajv, OPERATION);
  const applyWrappers = compose(...WRAPPERS) as WhookWrapper<
    Dependencies,
    Service
  >;

  const handler = await (
    applyWrappers(initHandler) as ServiceInitializer<Dependencies, Service>
  )({
    OPERATION,
    DEBUG_NODE_ENVS,
    NODE_ENV,
    ...services,
    time,
    log,
  });

  return (handleForAWSHTTPLambda as any).bind(
    null,
    {
      OPERATION,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      DECODERS,
      ENCODERS,
      PARSED_HEADERS,
      log,
      time,
      ...services,
    },
    {
      consumableMediaTypes,
      produceableMediaTypes,
      consumableCharsets,
      produceableCharsets,
      validators,
      bodyValidator,
      ammendedParameters,
    },
    handler,
  );
}

async function handleForAWSHTTPLambda(
  {
    OPERATION,
    NODE_ENV,
    ENCODERS,
    DECODERS,
    PARSERS = DEFAULT_PARSERS,
    STRINGIFYERS = DEFAULT_STRINGIFYERS,
    BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
    PARSED_HEADERS,
    CORS,
    log = noop,
    time = Date.now.bind(Date),
    apm,
    obfuscator,
    errorHandler,
  }: HTTPWrapperDependencies & { CORS: CORSConfig },
  {
    consumableMediaTypes,
    produceableMediaTypes,
    consumableCharsets,
    produceableCharsets,
    validators,
    bodyValidator,
    ammendedParameters,
  },
  handler: WhookHandler<LambdaHTTPInput, LambdaHTTPOutput>,
  event: APIGatewayProxyEvent,
  context: Context,
  callback: (err: Error, result?: APIGatewayProxyResult) => void,
) {
  const startTime = time();
  const bufferLimit = bytes.parse(BUFFER_LIMIT);
  const operationParameters = (OPERATION.parameters || []).concat(
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
    const operation = OPERATION;
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
      (operation.responses[response.status] as OpenAPIV3.ResponseObject);
    const responseSchema =
      responseObject &&
      responseObject.content &&
      responseObject.content[response.headers['content-type']] &&
      (responseObject.content[response.headers['content-type']]
        .schema as OpenAPIV3.SchemaObject);
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
      code: (err as YError).code || 'E_UNEXPECTED',
      statusCode: response.status,
      params: (err as YError).params || [],
      stack: (err as Error).stack,
    };

    log('error', JSON.stringify(responseLog));

    response = {
      ...response,
      headers: {
        ...response.headers,
        ...lowerCaseHeaders(CORS),
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

  apm('CALL', {
    id: event.requestContext.requestId,
    transactionId:
      request.headers['x-transaction-id'] &&
      new RegExp(uuidPattern).test(
        request.headers['x-transaction-id'] as string,
      )
        ? event.headers['x-transaction-id']
        : event.requestContext.requestId,
    environment: NODE_ENV,
    method: event.requestContext.httpMethod,
    resourcePath: event.requestContext.resourcePath,
    path: event.requestContext.path,
    userAgent:
      event.requestContext.identity && event.requestContext.identity.userAgent,
    triggerTime: event.requestContext.requestTimeEpoch,
    lambdaName: OPERATION.operationId,
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
    stack: responseLog.stack,
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
  callback(null as unknown as Error, awsResponse);
}

async function awsRequestEventToRequest(
  event: APIGatewayProxyEvent,
): Promise<WhookRequest> {
  const queryStringParametersNames = Object.keys(
    event.multiValueQueryStringParameters || {},
  );
  const request: WhookRequest = {
    method: event.requestContext.httpMethod.toLowerCase(),
    headers: lowerCaseHeaders(event.headers as Record<string, string>),
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
