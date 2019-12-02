import { initializer } from 'knifecycle';
import { DEFAULT_DEBUG_NODE_ENVS, DEFAULT_STRINGIFYERS } from './constants';
import { WhookStringifyers } from '.';
import { ResponseSpec } from './lib';
import { WhookResponse } from '@whook/http-transaction';
import YError from 'yerror';
import YHTTPError from 'yhttperror';

export interface WhookErrorHandler {
  (transactionId: string, responseSpec: ResponseSpec, err: Error): Promise<
    WhookResponse
  >;
}

export default initializer(
  {
    name: 'errorHandler',
    type: 'service',
    inject: ['NODE_ENV', '?DEBUG_NODE_ENVS', '?STRINGIFYERS'],
  },
  initErrorHandler,
);

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
async function initErrorHandler({
  NODE_ENV,
  DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
}: {
  NODE_ENV: string;
  DEBUG_NODE_ENVS: string[];
  STRINGIFYERS?: WhookStringifyers;
}): Promise<WhookErrorHandler> {
  return errorHandler;

  /**
   * Handle an HTTP transaction error and
   * map it to a serializable response
   * @param  {String}  transactionId
   * A raw NodeJS HTTP incoming message
   * @param  {Object} responseSpec
   * The response specification
   * @param  {HTTPError} err
   * The encountered error
   * @return {Promise}
   * A promise resolving when the operation
   *  completes
   */
  async function errorHandler(
    transactionId: string,
    responseSpec: ResponseSpec,
    err: Error | YError | YHTTPError,
  ) {
    const response: WhookResponse = {
      status: 500,
    };

    response.status = (err as YHTTPError).httpCode || 500;
    response.headers = Object.assign({}, (err as YHTTPError).headers || {}, {
      // Avoid caching errors
      'cache-control': 'private',
      // Fallback to the default stringifyer to always be
      // able to display errors
      'content-type':
        responseSpec &&
        responseSpec.contentTypes[0] &&
        STRINGIFYERS[responseSpec.contentTypes[0]]
          ? responseSpec.contentTypes[0]
          : Object.keys(STRINGIFYERS)[0],
    });

    response.body = {
      error: {
        code: (err as YError).code || 'E_UNEXPECTED',
        // Enjoy nerdy stuff:
        // https://en.wikipedia.org/wiki/Guru_Meditation
        guruMeditation: transactionId,
      },
    };

    if (DEBUG_NODE_ENVS.includes(NODE_ENV)) {
      response.body.error.stack = err.stack;
      response.body.error.params = (err as YError).params;
    }

    return response;
  }
}
