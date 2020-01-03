import { WhookHandler } from '@whook/whook';
import { ServiceInitializer, Parameters, Dependencies } from 'knifecycle';
import { OpenAPIV3 } from 'openapi-types';
export declare type CORSConfig = {
  CORS: {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Headers': string;
    Vary: string;
  };
};
/**
 * Wrap an handler initializer to append CORS to response.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export declare function wrapHandlerWithCORS<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & CORSConfig, S>;
export declare function initHandlerWithCORS<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S>;
/**
 * Augment an OpenAPI to also serve OPTIONS methods with
 *  the CORS added.
 * @param {Object} API The OpenAPI object
 * @returns {Promise<Object>} The augmented  OpenAPI object
 */
export declare function augmentAPIWithCORS(
  API: OpenAPIV3.Document,
): Promise<OpenAPIV3.Document>;
/**
 * A simple Whook handler that just returns a 200 OK
 *  HTTP response
 * @returns {Promise<Object>} The HTTP response object
 */
export declare const optionsWithCORS: import('knifecycle').HandlerInitializer<
  Dependencies<any>,
  [],
  {
    status: number;
  },
  Parameters,
  import('knifecycle').Handler<
    Parameters,
    [],
    {
      status: number;
    }
  >
>;
