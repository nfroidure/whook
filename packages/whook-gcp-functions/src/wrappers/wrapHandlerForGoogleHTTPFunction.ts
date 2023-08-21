/* eslint-disable @typescript-eslint/no-explicit-any */
import { YError, printStackTrace } from 'yerror';
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
import { autoService } from 'knifecycle';
import Ajv from 'ajv';
import addAJVFormats from 'ajv-formats';
import bytes from 'bytes';
import { YHTTPError } from 'yhttperror';
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
import { noop, identity, lowerCaseHeaders } from '@whook/whook';
import stream from 'stream';
import type { WhookQueryStringParser } from '@whook/http-router';
import type {
  WhookRequest,
  WhookResponse,
  WhookHandler,
  WhookObfuscatorService,
  WhookOperation,
  WhookWrapper,
  WhookErrorHandler,
} from '@whook/whook';
import type { LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { Readable } from 'stream';
import type { AppEnvVars } from 'application-services';

const SEARCH_SEPARATOR = '?';
const PATH_SEPARATOR = '/';

export type WhookWrapHTTPFunctionDependencies = {
  OPERATION_API: OpenAPIV3.Document;
  ENV: AppEnvVars;
  DEBUG_NODE_ENVS?: string[];
  DECODERS?: typeof DEFAULT_DECODERS;
  ENCODERS?: typeof DEFAULT_ENCODERS;
  PARSERS?: typeof DEFAULT_PARSERS;
  STRINGIFYERS?: typeof DEFAULT_STRINGIFYERS;
  QUERY_PARSER: WhookQueryStringParser;
  BUFFER_LIMIT?: string;
  obfuscator: WhookObfuscatorService;
  errorHandler: WhookErrorHandler;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with GCP Functions.
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
 * @param  {Object}   services.PARSERS
 * Request body parsers available
 * @param  {Object}   services.STRINGIFYERS
 * Response body stringifyers available
 * @param  {Object}   services.BUFFER_LIMIT
 * The buffer size limit
 * @param  {Object}   services.QUERY_PARSER
 * The query parser to use
 * @param  {Object}   services.obfuscator
 * A service to hide sensible values
 * @param  {Object}   services.errorHandler
 * A service that changes any error to Whook response
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */

async function initWrapHandlerForGoogleHTTPFunction<S extends WhookHandler>({
  OPERATION_API,
  ENV,
  DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
  DECODERS = DEFAULT_DECODERS,
  ENCODERS = DEFAULT_ENCODERS,
  PARSERS = DEFAULT_PARSERS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
  BUFFER_LIMIT = DEFAULT_BUFFER_LIMIT,
  QUERY_PARSER,
  obfuscator,
  errorHandler,
  log = noop,
}: WhookWrapHTTPFunctionDependencies): Promise<WhookWrapper<S>> {
  log('debug', '📥 - Initializing the AWS Lambda cron wrapper.');

  const path = Object.keys(OPERATION_API.paths)[0];
  const pathObject = OPERATION_API.paths[path];

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
      log: (...args: string[]) => log?.('debug', ...args),
      warn: (...args: string[]) => log?.('warning', ...args),
      error: (...args: string[]) => log?.('error', ...args),
    },
    useDefaults: true,
    coerceTypes: true,
  });
  addAJVFormats.default(ajv);
  const ammendedParameters = extractOperationSecurityParameters(
    OPERATION_API,
    operation,
  );
  const validators = prepareParametersValidators(
    ajv,
    operation.operationId,
    ((operation.parameters || []) as OpenAPIV3.ParameterObject[]).concat(
      ammendedParameters,
    ),
  );
  const bodyValidator = prepareBodyValidator(ajv, operation);
  const wrapper = async (handler: S): Promise<S> => {
    const wrappedHandler = handleForAWSHTTPFunction.bind(
      null,
      {
        DECODERS,
        ENCODERS,
        PARSERS,
        STRINGIFYERS,
        BUFFER_LIMIT,
        QUERY_PARSER,
        obfuscator,
        errorHandler,
        log,
      },
      {
        consumableMediaTypes,
        produceableMediaTypes,
        consumableCharsets,
        produceableCharsets,
        validators,
        bodyValidator,
        operation,
      },
      handler as any,
    );

    return wrappedHandler as unknown as S;
  };

  return wrapper;
}

async function handleForAWSHTTPFunction(
  {
    DECODERS,
    ENCODERS,
    PARSERS,
    STRINGIFYERS,
    BUFFER_LIMIT,
    QUERY_PARSER,
    obfuscator,
    errorHandler,
    log,
  }: Omit<
    Required<WhookWrapHTTPFunctionDependencies>,
    'time' | 'OPERATION_API' | 'ENV' | 'DEBUG_NODE_ENVS'
  >,
  {
    consumableMediaTypes,
    produceableMediaTypes,
    consumableCharsets,
    produceableCharsets,
    validators,
    bodyValidator,
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
    operation: WhookOperation;
  },
  handler: WhookHandler,
  req,
  res,
) {
  const bufferLimit = bytes.parse(BUFFER_LIMIT);

  log?.(
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

  log?.(
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
      const path = request.url.split(SEARCH_SEPARATOR)[0];
      const parts = path.split(PATH_SEPARATOR).filter(identity);
      const search = request.url.substr(
        request.url.split(SEARCH_SEPARATOR)[0].length,
      );

      const pathParameters = (
        operation.path
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

      // TODO: Update strictQS to handle OpenAPI 3
      const retroCompatibleQueryParameters = (operation.parameters || [])
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

export default autoService(initWrapHandlerForGoogleHTTPFunction);
