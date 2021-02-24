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
import { noop, compose, identity } from '@whook/whook';
import { lowerCaseHeaders } from '@whook/cors';
import stream from 'stream';
import type { WhookQueryStringParser } from '@whook/http-router';
import type { ServiceInitializer, Dependencies, Service } from 'knifecycle';
import type {
  WhookRequest,
  WhookResponse,
  WhookHandler,
  ObfuscatorService,
  WhookOperation,
  WhookWrapper,
} from '@whook/whook';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { Readable } from 'stream';
import type { CORSConfig } from '@whook/cors';

type HTTPWrapperDependencies = {
  NODE_ENV: string;
  DEBUG_NODE_ENVS?: string[];
  OPERATION: WhookOperation;
  DECODERS?: typeof DEFAULT_DECODERS;
  ENCODERS?: typeof DEFAULT_ENCODERS;
  PARSERS?: typeof DEFAULT_PARSERS;
  STRINGIFYERS?: typeof DEFAULT_STRINGIFYERS;
  QUERY_PARSER: WhookQueryStringParser;
  BUFFER_LIMIT?: string;
  obfuscator: ObfuscatorService;
  time?: TimeService;
  log?: LogService;
  WRAPPERS: WhookWrapper<Dependencies, Service>[];
};

const SEARCH_SEPARATOR = '?';
const PATH_SEPARATOR = '/';

export default function wrapHandlerForAWSHTTPFunction<
  D,
  S extends WhookHandler
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
      '?PARSERS',
      '?STRINGIFYERS',
      '?BUFFER_LIMIT',
      'QUERY_PARSER',
      'obfuscator',
      '?log',
      '?time',
    ],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSHTTPFunction.bind(
        null,
        initHandler,
      ) as ServiceInitializer<D, S>,
    ),
  );
}

async function initHandlerForAWSHTTPFunction(
  initHandler: ServiceInitializer<unknown, WhookHandler>,
  {
    OPERATION_API,
    WRAPPERS,
    NODE_ENV,
    DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
    DECODERS = DEFAULT_DECODERS,
    ENCODERS = DEFAULT_ENCODERS,
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
    strict: true,
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
  const applyWrappers = compose(...WRAPPERS) as WhookWrapper<
    Dependencies,
    Service
  >;

  const handler = await (applyWrappers(initHandler) as ServiceInitializer<
    Dependencies,
    Service
  >)({
    OPERATION,
    DEBUG_NODE_ENVS,
    NODE_ENV,
    ...services,
    time,
    log,
  });

  return handleForAWSHTTPFunction.bind(
    null,
    {
      OPERATION,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      DECODERS,
      ENCODERS,
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

async function handleForAWSHTTPFunction(
  {
    OPERATION,
    DEBUG_NODE_ENVS,
    NODE_ENV,
    ENCODERS,
    DECODERS,
    PARSERS = DEFAULT_PARSERS,
    STRINGIFYERS = DEFAULT_STRINGIFYERS,
    BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
    QUERY_PARSER,
    CORS,
    log,
    obfuscator,
  }: HTTPWrapperDependencies & { CORS: CORSConfig },
  {
    consumableMediaTypes,
    produceableMediaTypes,
    consumableCharsets,
    produceableCharsets,
    validators,
    bodyValidator,
  },
  handler: WhookHandler,
  req,
  res,
) {
  const debugging = DEBUG_NODE_ENVS.includes(NODE_ENV);
  const bufferLimit = bytes.parse(BUFFER_LIMIT);

  log(
    'info',
    'GCP_FUNCTIONS_REQUEST',
    JSON.stringify({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      // body: obfuscateEventBody(obfuscator, req.body),
      headers: obfuscator.obfuscateSensibleHeaders(req.headers),
    }),
  );

  const request = await gcpfReqToRequest(req);
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
      const path = request.url.split(SEARCH_SEPARATOR)[0];
      const parts = path.split(PATH_SEPARATOR).filter(identity);
      const search = request.url.substr(
        request.url.split(SEARCH_SEPARATOR)[0].length,
      );

      const pathParameters = OPERATION.path
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
        })
        .filter(identity)
        .reduce(
          (accParameters, { name, value }) => ({
            ...accParameters,
            [name]: value,
          }),
          {},
        );

      // TODO: Update strictQS to handle OpenAPI 3
      const retroCompatibleQueryParameters = (OPERATION.parameters || [])
        .filter((p) => p.in === 'query')
        .map((p) => ({ ...p, ...p.schema }));

      parameters = {
        ...pathParameters,
        ...QUERY_PARSER(retroCompatibleQueryParameters as any, search),
        ...filterHeaders(operation.parameters, request.headers),
      };

      parameters = {
        // TODO: Use the security of the operation to infer
        // authorization parameters, see:
        // https://github.com/nfroidure/whook/blob/06ccae93d1d52d97ff70fd5e19fa826bdabf3968/packages/whook-http-router/src/validation.js#L110
        authorization: parameters.authorization,
        ...castParameters(operation.parameters || [], parameters),
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
        ...lowerCaseHeaders(CORS),
        ...(castedError.headers ?? {}),
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

  await pipeResponseInGCPFResponse(
    await sendBody(
      {
        ENCODERS,
        STRINGIFYERS,
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
  Object.keys(response.headers).forEach((headerName) => {
    res.set(headerName, response.headers[headerName]);
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
