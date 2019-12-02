import { OpenAPIV3 } from 'openapi-types';
import { WhookOperation } from '@whook/http-transaction';
export declare type SupportedSecurityScheme =
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
export declare function flattenOpenAPI(
  API: OpenAPIV3.Document,
): Promise<OpenAPIV3.Document>;
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
export declare function getOpenAPIOperations(
  API: OpenAPIV3.Document,
): WhookOperation[];
export declare function pickupOperationSecuritySchemes(
  openAPI: OpenAPIV3.Document,
  operation: WhookOperation,
): {
  [name: string]: SupportedSecurityScheme;
};
