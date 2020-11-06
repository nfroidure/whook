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
import bytes from 'bytes';
import HTTPError from 'yhttperror';
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
import { noop, compose } from '@whook/whook';
import type { ServiceInitializer, HandlerInitializer } from 'knifecycle';
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
import type { DereferencedParameterObject } from '@whook/http-transaction';

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
  time?: TimeService;
  log?: LogService;
  WRAPPERS: WhookWrapper<any, any>[];
};

const SEARCH_SEPARATOR = '?';
const uuidPattern =
  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

export default function wrapHandlerForAWSHTTPLambda<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & HTTPWrapperDependencies, S> {
  return alsoInject(
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
      '?log',
      '?time',
    ],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSHTTPLambda.bind(null, initHandler),
    ),
  ) as any;
}

async function initHandlerForAWSHTTPLambda(
  initHandler: HandlerInitializer<unknown, unknown[], unknown>,
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
  const ajv = new Ajv({
    verbose: DEBUG_NODE_ENVS.includes(NODE_ENV),
    useDefaults: true,
    coerceTypes: true,
    strictKeywords: true,
  });
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
  const applyWrappers = compose(...WRAPPERS);

  const handler = await applyWrappers(initHandler)({
    OPERATION,
    DEBUG_NODE_ENVS,
    NODE_ENV,
    ...services,
    time,
    log,
  });

  return handleForAWSHTTPLambda.bind(
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
    DEBUG_NODE_ENVS,
    NODE_ENV,
    ENCODERS,
    DECODERS,
    PARSERS = DEFAULT_PARSERS,
    STRINGIFYERS = DEFAULT_STRINGIFYERS,
    BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
    PARSED_HEADERS,
    // TODO: Better handling of CORS in errors should
    // be found
    CORS,
    log,
    time,
    apm,
    obfuscator,
  }: HTTPWrapperDependencies & { CORS: any },
  {
    consumableMediaTypes,
    produceableMediaTypes,
    consumableCharsets,
    produceableCharsets,
    validators,
    bodyValidator,
    ammendedParameters,
  },
  handler: WhookHandler,
  event,
  context: unknown,
  callback: (err: Error, result?: any) => void,
) {
  const debugging = DEBUG_NODE_ENVS.includes(NODE_ENV);
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
      headers: obfuscator.obfuscateSensibleHeaders(event.headers),
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
        request.body,
        bodySpec,
      );

      parameters = {
        ...(event.pathParameters || {}),
        ...filterQueryParameters(
          operationParameters,
          event.multiValueQueryStringParameters || {},
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
      throw HTTPError.cast(err, 400);
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
      throw new HTTPError(
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
    const castedError = HTTPError.cast(err);

    responseLog = {
      type: 'error',
      code: castedError.code,
      statusCode: castedError.httpCode,
      params: castedError.params || [],
      stack: castedError.stack,
    };

    log('error', JSON.stringify(responseLog));
    response = {
      status: castedError.httpCode,
      headers: {
        ...CORS,
        'content-type': 'application/json',
      },
      body: {
        error: {
          code: castedError.code,
          stack: debugging ? responseLog.stack : undefined,
          params: debugging ? responseLog.params : undefined,
        },
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
      headers: obfuscator.obfuscateSensibleHeaders(awsResponse.headers),
    }),
  );

  apm('CALL', {
    id: event.requestContext.requestId,
    transactionId:
      request.headers['x-transaction-id'] &&
      new RegExp(uuidPattern).test(request.headers['x-transaction-id'])
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
          ...(PARSED_HEADERS.includes(headerName)
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
    ...PARSED_HEADERS.reduce(
      (result, parsedHeader) => ({
        ...result,
        ...(response.headers[parsedHeader]
          ? JSON.parse(response.headers[parsedHeader])
          : {}),
      }),
      {},
    ),
  });
  callback(null, awsResponse);
}

async function awsRequestEventToRequest(event: any): Promise<WhookRequest> {
  const queryStringParametersNames = Object.keys(
    event.multiValueQueryStringParameters || {},
  );
  const request: WhookRequest = {
    method: event.requestContext.httpMethod.toLowerCase(),
    headers: lowerCaseHeaders(event.headers || {}),
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
    request.headers['content-length'] = buf.length.toString();
    request.body = new stream.PassThrough();
    request.body.write(buf);
    request.body.end();
  }

  return request;
}

type AWSResponseEvent = {
  statusCode: number;
  headers: { [name: string]: string };
  multiValueHeaders: { [name: string]: string[] };
  body?: string;
  isBase64Encoded?: boolean;
};

async function responseToAWSResponseEvent(
  response: WhookResponse,
): Promise<AWSResponseEvent> {
  const amazonResponse: AWSResponseEvent = {
    statusCode: response.status,
    headers: Object.keys(response.headers || {}).reduce(
      (stringHeaders, name) => ({
        ...stringHeaders,
        ...(typeof response.headers[name] === 'string'
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
        ...((response.headers[name] as any) instanceof Array
          ? {
              [name]: response.headers[name],
            }
          : {}),
      }),
      {},
    ),
  };

  if (response.body) {
    const stream = response.body;
    const buf: Buffer = await new Promise((resolve, reject) => {
      const chunks = [];

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
      (response.headers['content-type'] as 'string').startsWith('image/') ||
      (response.headers['content-type'] as 'string').startsWith(
        'application/pdf',
      )
    ) {
      amazonResponse.body = buf.toString('base64');
      amazonResponse.isBase64Encoded = true;
    } else {
      amazonResponse.body = buf.toString();
    }
  }

  return amazonResponse;
}

function lowerCaseHeaders(headers) {
  return Object.keys(headers).reduce((newHeaders, name) => {
    const newName = name.toLowerCase();

    newHeaders[newName] = headers[name];
    return newHeaders;
  }, {});
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
