import SwaggerParser from '@apidevtools/swagger-parser';
import YError from 'yerror';
import type { OpenAPIV3 } from 'openapi-types';
import type { WhookOperation } from '@whook/http-transaction';

export const OPEN_API_METHODS = [
  'options',
  'head',
  'get',
  'put',
  'post',
  'patch',
  'delete',
  'trace',
];

export type SupportedSecurityScheme =
  | OpenAPIV3.HttpSecurityScheme
  | OpenAPIV3.ApiKeySecurityScheme
  | OpenAPIV3.OAuth2SecurityScheme;

/**
 * Flatten the inputed OpenAPI file
 *  object
 * @param  {Object} API
 * An Object containing a parser OpenAPI JSON
 * @return {Object}
 * The flattened OpenAPI definition
 */
export async function flattenOpenAPI(
  API: OpenAPIV3.Document,
): Promise<OpenAPIV3.Document> {
  try {
    const parser = new SwaggerParser();

    // Currently the OpenAPI parser changes the API in place
    //  this is why we're deep cloning it here
    const result = (await parser.dereference(
      JSON.parse(JSON.stringify(API)),
    )) as OpenAPIV3.Document;

    return result;
  } catch (err) {
    throw YError.wrap(err, 'E_BAD_OPEN_API');
  }
}

/**
 * Return a OpenAPI operation in a more
 *  convenient way to iterate onto its
 *  operations
 * @param  {Object} API
 * The flattened OpenAPI defition
 * @return {Array}
 * An array of all the OpenAPI operations
 * @example
 * getOpenAPIOperations(API)
 * .map((operation) => {
 *    const { path, method, operationId, parameters } = operation;
 *
 *   // Do something with that operation
 * });
 */
export function getOpenAPIOperations(
  API: OpenAPIV3.Document,
): WhookOperation[] {
  return Object.keys(API.paths).reduce(
    (operations, path) =>
      Object.keys(API.paths[path])
        .filter((key) => OPEN_API_METHODS.includes(key))
        .reduce(
          (operations, method) =>
            operations.concat({
              path,
              method,
              ...API.paths[path][method],
              parameters: (API.paths[path][method].parameters || []).concat(
                API.paths[path].parameters || [],
              ),
            }),
          operations,
        ),
    [],
  );
}

export function pickupOperationSecuritySchemes(
  openAPI: OpenAPIV3.Document,
  operation: WhookOperation,
): { [name: string]: SupportedSecurityScheme } {
  const securitySchemes =
    (openAPI.components && openAPI.components.securitySchemes) || {};

  return (operation.security || openAPI.security || []).reduce(
    (operationSecuritySchemes, security) => {
      const schemeKey = Object.keys(security)[0];

      if (!schemeKey) {
        return operationSecuritySchemes;
      }

      if (!securitySchemes[schemeKey]) {
        throw new YError(
          'E_UNDECLARED_SECURITY_SCHEME',
          schemeKey,
          operation.operationId,
        );
      }

      return {
        ...operationSecuritySchemes,
        [schemeKey]: securitySchemes[schemeKey] as SupportedSecurityScheme,
      };
    },
    {},
  ) as { [name: string]: SupportedSecurityScheme };
}
