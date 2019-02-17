import SwaggerParser from 'swagger-parser';

/**
 * Flatten the inputed Swagger file
 *  object
 * @param  {Object} API
 * An Object containing a parser Swagger JSON
 * @return {Object}
 * The flattened Swagger definition
 */
export function flattenSwagger(API) {
  const parser = new SwaggerParser();

  // Currently the Swagger parser changes the API in place
  //  this is why we're deep cloning it here
  return parser.dereference(JSON.parse(JSON.stringify(API)));
}

/**
 * Return a Swagger operation in a more
 *  convenient way to iterate onto its
 *  operations
 * @param  {Object} API
 * The flattened Swagger defition
 * @return {Array}
 * An array of all the Swagger operations
 * @example
 * getSwaggerOperations(API)
 * .map((operation) => {
 *    const { path, method, operationId, parameters } = operation;
 *
 *   // Do something with that operation
 * });
 */
export function getSwaggerOperations(API) {
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
