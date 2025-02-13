import { noop, type LogService } from 'common-services';
import { YError } from 'yerror';
import { YHTTPError } from 'yhttperror';
import Stream from 'node:stream';
import { type ValidateFunction } from 'ajv';
import {
  ensureResolvedObject,
  type OpenAPIParameter,
  type OpenAPIExtension,
  type OpenAPI,
  type OpenAPISecurityScheme,
  type OpenAPIReference,
} from 'ya-open-api-types';
import {
  parseArrayOfBooleans,
  parseArrayOfNumbers,
  parseArrayOfStrings,
  parseBoolean,
  parseNumber,
  type WhookCoercionOptions,
} from './coercion.js';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import { type WhookSchemaValidatorsService } from '../services/schemaValidators.js';
import { type WhookRequestBody } from '../types/http.js';
import {
  type WhookOpenAPIOperation,
  type WhookOpenAPI,
  type WhookSupportedParameter,
} from '../types/openapi.js';

/* Architecture Note #2.11.2: Validation

For performance reasons, the schemaValidators are
 created once for all at startup from the
 API definition.

One could argue that it would have been
 better for performances to generate
 the code statically. This is true. It
 may be done later but it won't change
 the way it works so, moving fast for
 now but keeping it in mind.

Also, looking closely to Prepack that
 could improve significantly this
 project performances with close to no
 time costs:
 https://github.com/facebook/prepack/issues/522#issuecomment-300706099
*/

export type WhookBodyValidator = (
  operation: WhookOpenAPIOperation,
  contentType: string,
  body: WhookRequestBody | void,
) => void;

export async function prepareBodyValidator(
  {
    API,
    schemaValidators,
  }: { API: OpenAPI; schemaValidators: WhookSchemaValidatorsService },
  operation: WhookOpenAPIOperation,
): Promise<WhookBodyValidator> {
  if (!('requestBody' in operation) || !operation.requestBody) {
    return rejectAnyRequestBody;
  }

  const requestBodyObject = await ensureResolvedObject(
    API,
    operation.requestBody,
  );

  if (!requestBodyObject.content) {
    return rejectAnyRequestBody;
  }

  const bodyValidators = {};

  for (const mediaType of Object.keys(requestBodyObject.content)) {
    const mediaTypeObject = requestBodyObject.content[mediaType];

    if (!('schema' in mediaTypeObject) || !mediaTypeObject.schema) {
      continue;
    }

    const schema = (await ensureResolvedObject(
      API,
      mediaTypeObject.schema,
    )) as ExpressiveJSONSchema;

    const isBinaryContent =
      typeof schema === 'object' &&
      schema &&
      'type' in schema &&
      schema.type === 'string' &&
      schema.format === 'binary';

    if (isBinaryContent) {
      continue;
    }

    try {
      bodyValidators[mediaType] = schemaValidators(mediaTypeObject.schema);
    } catch (err) {
      throw YError.wrap(
        err as Error,
        'E_BAD_BODY_SCHEMA',
        operation.operationId,
        mediaType,
      );
    }
  }

  return validateRequestBody.bind(
    null,
    bodyValidators,
    !!requestBodyObject.required,
  );
}

function validateRequestBody(
  bodyValidators: Record<string, ValidateFunction>,
  required: boolean,
  operation: WhookOpenAPIOperation,
  contentType: string,
  body: WhookRequestBody | void,
): void {
  if ('undefined' === typeof body) {
    if (required) {
      throw new YHTTPError(
        400,
        'E_REQUIRED_REQUEST_BODY',
        operation.operationId,
        typeof body,
        body,
      );
    }
    return;
  }

  // Streamed contents, let it pass
  if (!bodyValidators[contentType]) {
    return;
  }

  if (!bodyValidators[contentType](body)) {
    throw new YHTTPError(
      400,
      'E_BAD_REQUEST_BODY',
      operation.operationId,
      typeof body,
      (body as WhookRequestBody) instanceof Stream ? 'Stream' : body,
      bodyValidators[contentType].errors,
    );
  }
}

function rejectAnyRequestBody(
  operation: WhookOpenAPIOperation,
  _contentType: string,
  body: unknown,
): void {
  if ('undefined' !== typeof body) {
    throw new YHTTPError(
      400,
      'E_NO_REQUEST_BODY',
      operation.operationId,
      typeof body,
      body instanceof Stream ? 'Stream' : body,
    );
  }
}

// Supporting only mainstream schemes
// https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
const SUPPORTED_HTTP_SCHEMES = ['basic', 'bearer', 'digest'];

export async function extractOperationSecurityParameters(
  { API }: { API: WhookOpenAPI },
  operation: WhookOpenAPIOperation,
): Promise<WhookSupportedParameter[]> {
  const operationSecuritySchemes = await pickupOperationSecuritySchemes(
    { API },
    operation,
  );
  const securitySchemes = Object.keys(operationSecuritySchemes).map(
    (schemeKey) => operationSecuritySchemes[schemeKey],
  );

  return extractParametersFromSecuritySchemes(securitySchemes);
}

export async function pickupOperationSecuritySchemes(
  { API }: { API: WhookOpenAPI },
  operation: WhookOpenAPIOperation,
): Promise<{ [name: string]: OpenAPISecurityScheme<OpenAPIExtension> }> {
  const securitySchemes =
    (API.components && API.components.securitySchemes) || {};
  const operationSecuritySchemes = {};

  for (const security of operation.security || API.security || []) {
    const schemeKey = Object.keys(security)[0];

    if (!schemeKey) {
      continue;
    }

    if (!securitySchemes[schemeKey]) {
      throw new YError(
        'E_UNDECLARED_SECURITY_SCHEME',
        schemeKey,
        operation.operationId,
      );
    }

    operationSecuritySchemes[schemeKey] = await ensureResolvedObject(
      { API },
      securitySchemes[schemeKey],
    );
  }

  return operationSecuritySchemes;
}

export function extractParametersFromSecuritySchemes(
  securitySchemes: OpenAPISecurityScheme<OpenAPIExtension>[],
): WhookSupportedParameter[] {
  const hasOAuth = securitySchemes.some((securityScheme) =>
    ['oauth2', 'openIdConnect'].includes(securityScheme.type),
  );
  const httpSchemes = [
    ...new Set([
      ...securitySchemes
        .filter((securityScheme) => securityScheme.type === 'http')
        .map((securityScheme) => {
          if (!SUPPORTED_HTTP_SCHEMES.includes(securityScheme.scheme)) {
            throw new YError(
              'E_UNSUPPORTED_HTTP_SCHEME',
              securityScheme.scheme,
            );
          }
          return securityScheme.scheme;
        }),
      ...(hasOAuth ? ['bearer'] : []),
    ]),
  ];
  const hasBearerAuth = httpSchemes.includes('bearer');
  let hasAuthorizationApiKey = false;
  let hasAccessTokenApiKey = false;

  const securityParameters: WhookSupportedParameter[] = securitySchemes
    .filter((securityScheme) => securityScheme.type === 'apiKey')
    .map((securityScheme) => {
      if (securityScheme.in === 'cookie') {
        throw new YError(
          'E_UNSUPPORTED_API_KEY_SOURCE',
          'cookie',
          securityScheme.name,
        );
      }
      // This overlaps with OAuth/HTTP schemes
      if (
        securityScheme.in === 'header' &&
        securityScheme.name.toLowerCase() === 'authorization'
      ) {
        hasAuthorizationApiKey = true;
      }
      // This overlaps with OAuth and BearerAuth schemes
      if (
        securityScheme.in === 'query' &&
        securityScheme.name === 'access_token'
      ) {
        hasAccessTokenApiKey = true;
      }

      return {
        in: securityScheme.in,
        name:
          securityScheme.in === 'header'
            ? securityScheme.name.toLowerCase()
            : securityScheme.name,
        schema: {
          type: 'string',
        } as ExpressiveJSONSchema,
      };
    })
    .concat(
      httpSchemes.length && !hasAuthorizationApiKey
        ? [
            {
              in: 'header',
              name: 'authorization',
              schema: {
                type: 'string',
                pattern: `(${httpSchemes
                  .map(
                    (httpScheme) =>
                      `(${
                        httpScheme[0]
                      }|${httpScheme[0].toUpperCase()})${httpScheme.slice(1)}`,
                  )
                  .join('|')}) .*`,
              } as ExpressiveJSONSchema,
            },
          ]
        : [],
    )
    .concat(
      hasBearerAuth && !hasAccessTokenApiKey
        ? [
            {
              in: 'query',
              name: 'access_token',
              schema: {
                type: 'string',
              },
            },
          ]
        : [],
    );
  return securityParameters;
}

export async function resolveParameters(
  {
    API,
    log = noop,
  }: {
    API: WhookOpenAPI;
    log?: LogService;
  },
  parameters: (
    | OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>
    | OpenAPIReference<OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>>
  )[],
) {
  const resolvedParameters: WhookSupportedParameter[] = [];

  for (const parameter of parameters) {
    const resolvedParameter = await ensureResolvedObject(API, parameter);

    if ('style' in resolvedParameter) {
      log('warning', '⚠️ - Only defaults styles are supported currently!');
      log('debug', JSON.stringify(resolvedParameter));
    }
    if ('string' !== typeof resolvedParameter.name) {
      throw new YError('E_BAD_PARAMETER_NAME', resolvedParameter);
    }

    if ('content' in resolvedParameter) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        resolvedParameter.name,
        'content',
      );
    }

    if ('style' in resolvedParameter && 'simple' !== resolvedParameter.style) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        resolvedParameter.name,
        'style',
        resolvedParameter.style,
      );
    }

    if (!['query', 'header', 'path'].includes(resolvedParameter.in)) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        resolvedParameter.name,
        'in',
        resolvedParameter.in,
      );
    }

    if (!resolvedParameter.schema) {
      throw new YError('E_PARAMETER_WITHOUT_SCHEMA', resolvedParameter.name);
    }

    resolvedParameters.push(resolvedParameter);
  }

  return resolvedParameters;
}

export type WhookParameterValue =
  | boolean
  | boolean[]
  | string
  | string[]
  | number
  | number[]
  | undefined;
export type WhookParameterCaster = (str: string) => WhookParameterValue;
export type WhookParameterValidator = (
  str: string | undefined,
) => WhookParameterValue;
export type WhookParametersValidators = Record<
  'query' | 'header' | 'path' | 'cookie',
  Record<string, WhookParameterValidator>
>;

export async function createParameterValidator(
  {
    API,
    COERCION_OPTIONS,
    schemaValidators,
  }: {
    API: WhookOpenAPI;
    COERCION_OPTIONS: WhookCoercionOptions;
    schemaValidators: WhookSchemaValidatorsService;
  },
  parameter: WhookSupportedParameter,
): Promise<WhookParameterValidator> {
  let validator: ReturnType<typeof schemaValidators>;
  let caster: WhookParameterCaster | undefined = undefined;

  const schema = (await ensureResolvedObject(
    API,
    parameter.schema,
  )) as ExpressiveJSONSchema;

  if (!('type' in schema && schema.type)) {
    throw new YError('E_UNSUPPORTED_PARAMETER_SCHEMA', parameter);
  }

  if (schema.type === 'number') {
    caster = parseNumber.bind(null, COERCION_OPTIONS);
  } else if (schema.type === 'boolean') {
    caster = parseBoolean;
  } else if (schema.type === 'array') {
    if (!('items' in schema && schema.items) || 'prefixItems' in schema) {
      throw new YError('E_UNSUPPORTED_PARAMETER_SCHEMA', parameter);
    }

    const itemSchema = (await ensureResolvedObject(
      API,
      schema.items,
    )) as ExpressiveJSONSchema;

    if (!('type' in itemSchema && itemSchema.type)) {
      throw new YError('E_UNSUPPORTED_PARAMETER_SCHEMA', parameter);
    }
    if (itemSchema.type === 'string') {
      caster = parseArrayOfStrings;
    } else if (itemSchema.type === 'number') {
      caster = parseArrayOfNumbers.bind(null, COERCION_OPTIONS);
    } else if (itemSchema.type === 'boolean') {
      caster = parseArrayOfBooleans;
    }
  }

  try {
    validator = schemaValidators(parameter.schema);
  } catch (err) {
    throw YError.wrap(err as Error, 'E_BAD_PARAMETER_SCHEMA', parameter.name);
  }

  return validateParameter.bind(null, parameter, caster, validator);
}

export async function createParametersValidators(
  {
    API,
    COERCION_OPTIONS,
    schemaValidators,
  }: {
    API: WhookOpenAPI;
    COERCION_OPTIONS: WhookCoercionOptions;
    schemaValidators: WhookSchemaValidatorsService;
  },
  parameters: WhookSupportedParameter[],
) {
  const parameterValidators: WhookParametersValidators = {
    query: {},
    header: {},
    path: {},
    cookie: {},
  };

  for (const parameter of parameters) {
    parameterValidators[parameter.in][parameter.name] =
      await createParameterValidator(
        {
          API,
          COERCION_OPTIONS,
          schemaValidators,
        },
        parameter,
      );
  }

  return parameterValidators;
}

export function validateParameter(
  parameter: OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>,
  caster: WhookParameterCaster | undefined,
  validator: ValidateFunction,
  str: string | undefined,
): WhookParameterValue | undefined {
  if ('undefined' === typeof str) {
    if (parameter.required) {
      throw new YHTTPError(
        400,
        'E_REQUIRED_PARAMETER',
        parameter.name,
        typeof str,
        str,
      );
    }
    return undefined;
  }

  const value = caster ? caster(str) : str;

  if (!validator(value)) {
    throw new YHTTPError(
      400,
      'E_BAD_PARAMETER',
      parameter.name,
      typeof value,
      value,
      validator.errors,
    );
  }
  return value;
}
