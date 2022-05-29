import camelCase from 'camelcase';
import { YError } from 'yerror';
import { YHTTPError } from 'yhttperror';
import Stream from 'stream';
import { pickupOperationSecuritySchemes } from './openAPIUtils';
import Ajv from 'ajv';
import { parseReentrantNumber, parseBoolean } from 'strict-qs';
import type { ValidateFunction } from 'ajv';
import type { SupportedSecurityScheme } from './openAPIUtils';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  DereferencedParameterObject,
  WhookOperation,
  WhookHeaders,
  DereferencedRequestBodyObject,
} from '@whook/http-transaction';
import type { JsonValue } from 'type-fest';

/* Architecture Note #1.1: Validators
For performance reasons, the validators are
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

export function applyValidators(
  operation: WhookOperation,
  validators: { [name: string]: ValidateFunction },
  parameters: JsonValue[],
): void {
  ((operation.parameters || []) as OpenAPIV3.ParameterObject[]).forEach(
    ({ name, in: isIn }) => {
      if ('header' === isIn) {
        return validators[name](parameters[camelCase(name)]);
      }
      return validators[name](parameters[name]);
    },
  );
}

export function prepareBodyValidator(
  ajv: Ajv,
  operation: WhookOperation,
): (operation: WhookOperation, contentType: string, value: unknown) => void {
  if (
    !(
      'requestBody' in operation &&
      operation.requestBody &&
      operation.requestBody.content
    )
  ) {
    return _rejectAnyRequestBody;
  }

  const validators = Object.keys(operation.requestBody.content).reduce(
    (validators, mediaType) => {
      const mediaTypeObject = (
        operation.requestBody as DereferencedRequestBodyObject
      ).content[mediaType];
      const hasNoSchema = !mediaTypeObject.schema;

      if (hasNoSchema) {
        return validators;
      }

      const isBinaryContent =
        mediaTypeObject.schema.type === 'string' &&
        mediaTypeObject.schema.format === 'binary';

      if (isBinaryContent) {
        return validators;
      }

      let validator;

      try {
        validator = ajv.compile(mediaTypeObject.schema);
      } catch (err) {
        throw YError.wrap(
          err as Error,
          'E_BAD_BODY_SCHEMA',
          operation.operationId,
          mediaType,
        );
      }

      return {
        ...validators,
        [mediaType]: validator,
      };
    },
    {},
  );

  return _validateRequestBody.bind(
    null,
    validators as ValidateFunction<unknown>[],
  );
}

function _validateRequestBody(
  validators: ValidateFunction[],
  operation: WhookOperation,
  contentType: string,
  value: unknown,
): void {
  if (
    (operation.requestBody as OpenAPIV3.RequestBodyObject).required &&
    'undefined' === typeof value
  ) {
    throw new YHTTPError(
      400,
      'E_REQUIRED_REQUEST_BODY',
      operation.operationId,
      typeof value,
      value,
    );
  }
  // Streamed contents, let it pass
  if (!validators[contentType]) {
    return;
  }
  if ('undefined' !== typeof value && !validators[contentType](value)) {
    throw new YHTTPError(
      400,
      'E_BAD_REQUEST_BODY',
      operation.operationId,
      typeof value,
      value instanceof Stream ? 'Stream' : value,
      validators[contentType].errors,
    );
  }
}

function _rejectAnyRequestBody(
  operation: WhookOperation,
  _contentType: string,
  value: unknown,
): void {
  if ('undefined' !== typeof value) {
    throw new YHTTPError(
      400,
      'E_NO_REQUEST_BODY',
      operation.operationId,
      typeof value,
      value instanceof Stream ? 'Stream' : value,
    );
  }
}

// Supporting only mainstream schemes
// https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
const SUPPORTED_HTTP_SCHEMES = ['basic', 'bearer', 'digest'];

export function extractOperationSecurityParameters(
  openAPI: OpenAPIV3.Document,
  operation: WhookOperation,
): DereferencedParameterObject[] {
  const operationSecuritySchemes = pickupOperationSecuritySchemes(
    openAPI,
    operation,
  );
  const securitySchemes = Object.keys(operationSecuritySchemes).map(
    (schemeKey) => operationSecuritySchemes[schemeKey],
  );

  return extractParametersFromSecuritySchemes(securitySchemes);
}

export function extractParametersFromSecuritySchemes(
  securitySchemes: (SupportedSecurityScheme | OpenAPIV3.OpenIdSecurityScheme)[],
): DereferencedParameterObject[] {
  const hasOAuth = securitySchemes.some((securityScheme) =>
    ['oauth2', 'openIdConnect'].includes(securityScheme.type),
  );
  const httpSchemes = [
    ...new Set([
      ...securitySchemes
        .filter((securityScheme) => securityScheme.type === 'http')
        .map((securityScheme) => {
          if (
            !SUPPORTED_HTTP_SCHEMES.includes(
              (securityScheme as OpenAPIV3.HttpSecurityScheme).scheme,
            )
          ) {
            throw new YError(
              'E_UNSUPPORTED_HTTP_SCHEME',
              (securityScheme as OpenAPIV3.HttpSecurityScheme).scheme,
            );
          }
          return (securityScheme as OpenAPIV3.HttpSecurityScheme).scheme;
        }),
      ...(hasOAuth ? ['bearer'] : []),
    ]),
  ];
  const hasBearerAuth = httpSchemes.includes('bearer');
  let hasAuthorizationApiKey = false;
  let hasAccessTokenApiKey = false;

  const securityParameters: DereferencedParameterObject[] = securitySchemes
    .filter(
      (securityScheme): securityScheme is OpenAPIV3.ApiKeySecurityScheme =>
        securityScheme.type === 'apiKey',
    )
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
        },
      } as DereferencedParameterObject;
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
              },
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

export function prepareParametersValidators(
  ajv: Ajv,
  operationId: string,
  parameters: OpenAPIV3.ParameterObject[],
): { [name: string]: ValidateFunction } {
  return parameters.reduce((validators, parameter, index) => {
    if ('string' !== typeof parameter.name) {
      throw new YError(
        'E_BAD_PARAMETER_NAME',
        operationId,
        index,
        parameter.name,
      );
    }

    if (parameter.content) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        operationId,
        parameter.name,
        'content',
      );
    }

    if (parameter.style && 'simple' !== parameter.style) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        operationId,
        parameter.name,
        'style',
        parameter.style,
      );
    }

    if (!['query', 'header', 'path'].includes(parameter.in)) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        operationId,
        parameter.name,
        'in',
        parameter.in,
      );
    }

    if (!parameter.schema) {
      throw new YError('E_NO_PARAMETER_SCHEMA', operationId, parameter.name);
    }

    let validator;

    try {
      validator = ajv.compile(parameter.schema);
    } catch (err) {
      throw YError.wrap(
        err as Error,
        'E_BAD_PARAMETER_SCHEMA',
        operationId,
        parameter.name,
      );
    }

    validators[parameter.name] = _validateParameter.bind(
      null,
      parameter,
      validator,
    );
    return validators;
  }, {});
}

export function _validateParameter(
  parameter: OpenAPIV3.ParameterObject,
  validator: ValidateFunction,
  value: unknown,
): void {
  if (parameter.required && 'undefined' === typeof value) {
    throw new YHTTPError(
      400,
      'E_REQUIRED_PARAMETER',
      parameter.name,
      typeof value,
      value,
    );
  }
  if ('undefined' !== typeof value && !validator(value)) {
    throw new YHTTPError(
      400,
      'E_BAD_PARAMETER',
      parameter.name,
      typeof value,
      value,
      validator.errors,
    );
  }
}

export function filterHeaders(
  parameters: DereferencedParameterObject[],
  headers: WhookHeaders,
): WhookHeaders {
  return (parameters || [])
    .filter((parameter) => 'header' === parameter.in)
    .reduce((filteredHeaders, parameter) => {
      if (headers[parameter.name.toLowerCase()]) {
        filteredHeaders[camelCase(parameter.name)] =
          headers[parameter.name.toLowerCase()];
      }
      return filteredHeaders;
    }, {});
}

export function castParameters<
  T = boolean | boolean[] | string | string[] | number | number[],
>(
  parameters: DereferencedParameterObject[],
  values: WhookHeaders,
): Record<string, T> {
  return (parameters || []).reduce((filteredValues, parameter) => {
    const parameterName =
      parameter.in === 'header' ? camelCase(parameter.name) : parameter.name;

    if (values[parameterName]) {
      filteredValues[parameterName] = castSchemaValue(
        parameter.schema,
        values[parameterName],
      );
    }
    return filteredValues;
  }, {});
}

export function castSchemaValue<
  T = boolean | boolean[] | string | string[] | number | number[],
>(
  schema: DereferencedParameterObject['schema'],
  value: string | string[],
): T | undefined {
  let castedValue: T | undefined = undefined;

  if ('undefined' !== typeof value) {
    if ('array' === schema.type) {
      castedValue = (value as string[]).map(
        castSchemaValue.bind(
          null,
          schema.items as DereferencedParameterObject['schema'],
        ),
      ) as unknown as T;
    } else if ('boolean' === schema.type) {
      castedValue = parseBoolean(value as string) as unknown as T;
    } else if ('number' === schema.type) {
      castedValue = parseReentrantNumber(value as string) as unknown as T;
    } else {
      castedValue = value as unknown as T;
    }

    if (schema.enum && !schema.enum.includes(castedValue)) {
      throw new YHTTPError(400, 'E_NOT_IN_ENUM', castedValue, schema.enum);
    }
  }
  return castedValue;
}
