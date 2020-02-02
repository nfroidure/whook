import {
  DEFAULT_ENCODERS,
  DEFAULT_DECODERS,
} from '@whook/http-router/dist/constants';
import { reuseSpecialProps, alsoInject } from 'knifecycle';
import Ajv from 'ajv';
import HTTPError from 'yhttperror';
import {
  prepareParametersValidators,
  prepareBodyValidator,
  applyValidators,
  filterHeaders,
} from '@whook/http-router/dist/validation';
import {
  extractBodySpec,
  extractResponseSpec,
  checkResponseCharset,
  checkResponseMediaType,
  executeHandler,
  extractProduceableMediaTypes,
  extractConsumableMediaTypes,
} from '@whook/http-router/dist/lib';
import { getBody, sendBody } from '@whook/http-router/dist/body';
import { noop, compose } from '@whook/whook';
import { PassThrough } from 'stream';
import qs from 'qs';
import { camelCase } from 'camel-case';

const BASE_10 = 10;
const SEARCH_SEPARATOR = '?';
const uuidPattern =
  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

export default function wrapHandlerForAWSHTTPLambda(initHandler) {
  return alsoInject(
    [
      'OPERATION',
      'WRAPPERS',
      '?DEBUG_NODE_ENVS',
      'NODE_ENV',
      '?DECODERS',
      '?ENCODERS',
      '?PARSED_HEADERS',
      'PARSERS',
      'STRINGIFYERS',
      'apm',
      'obfuscator',
      '?log',
      '?time',
    ],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSHTTPLambda.bind(null, initHandler),
    ),
  );
}

async function initHandlerForAWSHTTPLambda(
  initHandler,
  {
    OPERATION,
    WRAPPERS,
    NODE_ENV,
    DEBUG_NODE_ENVS = [],
    DECODERS = DEFAULT_DECODERS,
    ENCODERS = DEFAULT_ENCODERS,
    PARSED_HEADERS = [],
    log = noop,
    time = Date.now.bind(Date),
    ...services
  },
) {
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
  const validators = prepareParametersValidators(
    ajv,
    OPERATION.operationId,
    OPERATION.parameters || [],
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
    PARSERS,
    STRINGIFYERS,
    PARSED_HEADERS,
    CORS,
    log,
    time,
    apm,
    obfuscator,
  },
  {
    consumableMediaTypes,
    produceableMediaTypes,
    consumableCharsets,
    produceableCharsets,
    validators,
    bodyValidator,
  },
  handler,
  event,
  context,
  callback,
) {
  const debugging = DEBUG_NODE_ENVS.includes(NODE_ENV);
  const startTime = time();

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
          // The limits are handled by AWS Gateway
          // TODO: add it anyway ?
          bufferLimit: Infinity,
        },
        operation,
        request.body,
        bodySpec,
      );

      parameters = {
        ...(event.pathParameters || {}),
        ...(event.queryStringParameters || {}),
        ...filterHeaders(operation.parameters, request.headers),
      };

      parameters = (OPERATION.parameters || []).reduce(
        (cleanParameters, parameter) => {
          const parameterName =
            parameter.in === 'header'
              ? camelCase(parameter.name)
              : parameter.name;

          cleanParameters[parameterName] = castParameterValue(
            parameter.schema,
            parameters[parameterName],
          );

          return cleanParameters;
        },
        {
          // TODO: Use the security of the operation to infer
          // authorization parameters, see:
          // https://github.com/nfroidure/whook/blob/06ccae93d1d52d97ff70fd5e19fa826bdabf3968/packages/whook-http-router/src/validation.js#L110
          authorization: parameters.authorization,
        },
      );

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
    ...PARSED_HEADERS.reduce((result, parsedHeader) => ({
      ...result,
      ...(response.headers[parsedHeader]
        ? JSON.parse(response.headers[parsedHeader])
        : {}),
    })),
  });
  callback(null, awsResponse);
}

async function awsRequestEventToRequest(event) {
  const queryStringParametersNames = Object.keys(
    event.requestContext.queryStringParameters || {},
  );
  const request = {
    method: event.requestContext.httpMethod.toLowerCase(),
    headers: lowerCaseHeaders(event.headers || {}),
    url:
      event.requestContext.path +
      (queryStringParametersNames.length
        ? SEARCH_SEPARATOR +
          qs.stringify(event.requestContext.queryStringParameters)
        : ''),
  };

  if (event.body) {
    const buf = Buffer.from(event.body);
    request.headers['content-length'] = buf.length;
    request.body = new PassThrough();
    request.body.write(buf);
    request.body.end();
  }

  return request;
}

async function responseToAWSResponseEvent(response) {
  const amazonResponse = {
    statusCode: response.status,
    headers: response.headers,
  };

  if (response.body) {
    const stream = response.body;
    const buf = await new Promise((resolve, reject) => {
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
      response.headers['content-type'].startsWith('image/') ||
      response.headers['content-type'].startsWith('application/pdf')
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

export function castParameterValue(parameter, value) {
  if ('undefined' !== typeof value) {
    if ('boolean' === parameter.type) {
      value = parseBoolean(value);
    } else if ('number' === parameter.type) {
      value = parseReentrantNumber(value);
    } else if ('array' === parameter.type) {
      value = ('' + value)
        .split(',')
        .map(castParameterValue.bind(null, parameter.items));
    }
    if (parameter.enum && !parameter.enum.includes(value)) {
      throw new HTTPError(400, 'E_NOT_IN_ENUM', value, parameter.enum);
    }
  }
  return value;
}

// Above functions were borrowed from here
// https://github.com/nfroidure/strict-qs/blob/master/src/index.js#L221-L238
// TODO: Export it on strict-qs
// and import it here
export function parseReentrantNumber(str) {
  const value = parseFloat(str, BASE_10);

  if (value.toString(BASE_10) !== str) {
    throw new HTTPError(
      400,
      'E_NON_REENTRANT_NUMBER',
      str,
      value.toString(BASE_10),
    );
  }

  return value;
}

export function parseBoolean(str) {
  if ('true' === str) {
    return true;
  } else if ('false' === str) {
    return false;
  }
  throw new HTTPError(400, 'E_BAD_BOOLEAN', str);
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
