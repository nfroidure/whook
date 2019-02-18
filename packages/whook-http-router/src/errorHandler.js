import { initializer } from 'knifecycle';
import { DEFAULT_DEBUG_NODE_ENVS, DEFAULT_STRINGIFYERS } from './constants';

export default initializer(
  {
    name: 'errorHandler',
    type: 'service',
    inject: ['?ENV', '?DEBUG_NODE_ENVS', '?STRINGIFYERS'],
  },
  initErrorHandler,
);

/**
 * Initialize an error handler for the
 * HTTP router
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   [services.ENV]
 * The services the server depends on
 * @param  {Array}   [services.DEBUG_NODE_ENVS]
 * The environnement that activate debugging
 *  (prints stack trace in HTTP errors responses)
 * @param  {Object} [services.STRINGIFYERS]
 * The synchronous body stringifyers
 * @return {Promise}
 * A promise of a function to handle errors
 */
function initErrorHandler({
  ENV = {},
  DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
}) {
  return Promise.resolve(errorHandler);

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
  function errorHandler(transactionId, responseSpec, err) {
    return Promise.resolve().then(() => {
      const response = {};

      response.status = err.httpCode || 500;
      response.headers = Object.assign({}, err.headers || {}, {
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
          code: err.code || 'E_UNEXPECTED',
          // Enjoy nerdy stuff:
          // https://en.wikipedia.org/wiki/Guru_Meditation
          guruMeditation: transactionId,
        },
      };

      if (ENV && DEBUG_NODE_ENVS.includes(ENV.NODE_ENV)) {
        response.body.error.stack = err.stack;
        response.body.error.params = err.params;
      }

      return response;
    });
  }
}
