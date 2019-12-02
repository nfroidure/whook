/// <reference types="node" />
import { Transform } from 'stream';
import { Provider } from 'knifecycle';
import strictQs from 'strict-qs';
import { WhookHandler, HTTPTransactionService } from '@whook/http-transaction';
import initErrorHandler, { WhookErrorHandler } from './errorHandler';
import { OpenAPIV3 } from 'openapi-types';
import { LogService } from 'common-services';
import { IncomingMessage, ServerResponse } from 'http';
export { initErrorHandler, WhookErrorHandler };
export declare type WhookHandlers = {
  [name: string]: WhookHandler;
};
export declare type WhookParser = (content: string) => string;
export declare type WhookParsers = {
  [name: string]: WhookParser;
};
export declare type WhookStringifyer = (content: string) => string;
export declare type WhookStringifyers = {
  [name: string]: WhookStringifyer;
};
export declare type WhookEncoder<T extends Transform> = {
  new (...args: any[]): T;
};
export declare type WhookEncoders<T extends Transform> = {
  [name: string]: WhookEncoder<T>;
};
export declare type WhookDecoder<T extends Transform> = {
  new (...args: any[]): T;
};
export declare type WhookDecoders<T extends Transform> = {
  [name: string]: WhookDecoder<T>;
};
export declare type HTTPRouterConfig = {
  NODE_ENV?: string;
  DEBUG_NODE_ENVS?: string[];
  BUFFER_LIMIT?: string;
  BASE_PATH: string;
};
export declare type HTTPRouterDependencies = HTTPRouterConfig & {
  NODE_ENV: string;
  HANDLERS: WhookHandlers;
  API: OpenAPIV3.Document;
  PARSERS?: WhookParsers;
  STRINGIFYERS?: WhookStringifyers;
  DECODERS?: WhookEncoders<Transform>;
  ENCODERS?: WhookDecoders<Transform>;
  QUERY_PARSER?: typeof strictQs;
  log?: LogService;
  httpTransaction: HTTPTransactionService;
  errorHandler: Function;
};
export interface HTTPRouterService {
  (req: IncomingMessage, res: ServerResponse): Promise<void>;
}
export declare type HTTPRouterProvider = Provider<HTTPRouterService>;
declare const _default: typeof initHTTPRouter;
export default _default;
/**
 * Initialize an HTTP router
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
 * @param  {Array}   [services.DEBUG_NODE_ENVS]
 * The environnement that activate debugging
 *  (prints stack trace in HTTP errors responses)
 * @param  {String}   [services.BUFFER_LIMIT]
 * The maximum bufferisation before parsing the
 *  request body
 * @param  {String}   [services.BASE_PATH]
 * API base path
 * @param  {Object}   services.HANDLERS
 * The handlers for the operations decribe
 *  by the OpenAPI API definition
 * @param  {Object}   services.API
 * The OpenAPI definition of the API
 * @param  {Object} [services.PARSERS]
 * The synchronous body parsers (for operations
 *  that defines a request body schema)
 * @param  {Object} [services.STRINGIFYERS]
 * The synchronous body stringifyers (for
 *  operations that defines a response body
 *  schema)
 * @param  {Object} [services.ENCODERS]
 * A map of encoder stream constructors
 * @param  {Object} [services.DECODERS]
 * A map of decoder stream constructors
 * @param  {Object} [services.QUERY_PARSER]
 * A query parser with the `strict-qs` signature
 * @param  {Function} [services.log=noop]
 * A logging function
 * @param  {Function} services.httpTransaction
 * A function to create a new HTTP transaction
 * @return {Promise}
 * A promise of a function to handle HTTP requests.
 */
declare function initHTTPRouter({
  NODE_ENV,
  DEBUG_NODE_ENVS,
  BUFFER_LIMIT,
  BASE_PATH,
  HANDLERS,
  API,
  PARSERS,
  STRINGIFYERS,
  DECODERS,
  ENCODERS,
  QUERY_PARSER,
  log,
  httpTransaction,
  errorHandler,
}: HTTPRouterDependencies): Promise<HTTPRouterProvider>;
