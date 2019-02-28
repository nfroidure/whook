import OpenAPIParser from 'swagger-parser';
import YError from 'yerror';

/**
 * Flatten the inputed OpenAPI file
 *  object
 * @param  {Object} API
 * An Object containing a parser OpenAPI JSON
 * @return {Object}
 * The flattened OpenAPI definition
 */
export async function flattenOpenAPI(API) {
  try {
    const parser = new OpenAPIParser();

    // Currently the OpenAPI parser changes the API in place
    //  this is why we're deep cloning it here
    const result = await parser.dereference(JSON.parse(JSON.stringify(API)));

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
export function getOpenAPIOperations(API) {
  return Object.keys(API.paths).reduce(
    (operations, path) =>
      Object.keys(API.paths[path]).reduce(
        (operations, method) =>
          operations.concat({
            path,
            method,
            ...API.paths[path][method],
          }),
        operations,
      ),
    [],
  );
}
