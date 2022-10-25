import { initErrorHandler } from '@whook/http-router';
import { wrapInitializer, alsoInject, ServiceInitializer } from 'knifecycle';
import { noop } from '@whook/whook';
import { YHTTPError } from 'yhttperror';
import { lowerCaseHeaders } from '@whook/whook';
import { mergeVaryHeaders } from '@whook/whook';
import type { LogService } from 'common-services';
import type {
  WhookErrorHandler,
  ErrorHandlerDependencies,
} from '@whook/http-router';
import type { WhookCORSConfig } from '../index.js';

type ErrorHandlerWrapperDependencies = WhookCORSConfig & { log?: LogService };

export default alsoInject<
  ErrorHandlerWrapperDependencies,
  ErrorHandlerDependencies,
  WhookErrorHandler
>(
  ['?log', 'CORS'],
  wrapInitializer(
    wrapErrorHandlerForCORS as ServiceInitializer<
      ErrorHandlerDependencies,
      WhookErrorHandler
    >,
    initErrorHandler,
  ),
);

/**
 * Wrap the error handler service as a last chance to add CORS
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value to add it to the build env
 * @param  {Object}   [services.PROXYED_ENV_VARS={}]
 * A list of environment variable names to proxy
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export async function wrapErrorHandlerForCORS(
  {
    log = noop,
    CORS,
  }: ErrorHandlerWrapperDependencies & ErrorHandlerDependencies,
  errorHandler: WhookErrorHandler,
): Promise<WhookErrorHandler> {
  log('info', '🕱 -Wrapping the error handler for CORS.');

  const wrappedErrorHandler: WhookErrorHandler = async (
    transactionId,
    responseSpec,
    err,
  ) => {
    try {
      // Try to set custom headers, could fail if err only has a getter
      (err as YHTTPError).headers = {
        ...lowerCaseHeaders(CORS),
        // Ensures to not override existing CORS headers
        // that could have been set in the handler wrapper
        // with endpoint specific CORS values
        ...lowerCaseHeaders((err as YHTTPError).headers || {}),
        vary: mergeVaryHeaders(
          ((err as YHTTPError).headers || {}).vary || '',
          'Origin',
        ),
      };
    } catch (err) {
      log('debug', '🤷 - Unable to set custom headers to the catched error!');
      log('debug-stack', (err as YHTTPError)?.stack || 'no_stack');
    }
    return errorHandler(transactionId, responseSpec, err);
  };

  return wrappedErrorHandler;
}
