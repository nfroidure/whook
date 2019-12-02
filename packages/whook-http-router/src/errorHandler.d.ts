import { WhookStringifyers } from '.';
import { ResponseSpec } from './lib';
import { WhookResponse } from '@whook/http-transaction';
export interface WhookErrorHandler {
  (transactionId: string, responseSpec: ResponseSpec, err: Error): Promise<
    WhookResponse
  >;
}
declare const _default: typeof initErrorHandler;
export default _default;
/**
 * Initialize an error handler for the
 * HTTP router
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
 * @param  {Array}   [services.DEBUG_NODE_ENVS]
 * The environnement that activate debugging
 *  (prints stack trace in HTTP errors responses)
 * @param  {Object} [services.STRINGIFYERS]
 * The synchronous body stringifyers
 * @return {Promise}
 * A promise of a function to handle errors
 */
declare function initErrorHandler({
  NODE_ENV,
  DEBUG_NODE_ENVS,
  STRINGIFYERS,
}: {
  NODE_ENV: string;
  DEBUG_NODE_ENVS: string[];
  STRINGIFYERS?: WhookStringifyers;
}): Promise<WhookErrorHandler>;
