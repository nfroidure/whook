import {
  wrapInitializer,
  alsoInject,
  location,
  type ServiceInitializer,
} from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { printStackTrace } from 'yerror';
import { type LogService } from 'common-services';
import {
  noop,
  lowerCaseHeaders,
  mergeVaryHeaders,
  initErrorHandler,
  type WhookErrorHandler,
  type WhookErrorHandlerDependencies,
} from '@whook/whook';
import { type WhookCORSConfig } from '../wrappers/wrapRouteHandlerWithCORS.js';

type ErrorHandlerWrapperDependencies = WhookCORSConfig & { log?: LogService };

export default location(
  alsoInject<
    ErrorHandlerWrapperDependencies,
    WhookErrorHandlerDependencies,
    WhookErrorHandler
  >(
    ['?log', 'CORS'],
    wrapInitializer(
      wrapErrorHandlerForCORS as ServiceInitializer<
        WhookErrorHandlerDependencies,
        WhookErrorHandler
      >,
      initErrorHandler,
    ),
  ),
  import.meta.url,
);

/**
 * Wrap the error handler service as a last chance to add CORS
 * @param  {Object}   services
 * The services depended on
 * @param  {Object}   services.CORS
 * A CORS object to be added to errors responses
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export async function wrapErrorHandlerForCORS(
  {
    log = noop,
    CORS,
  }: ErrorHandlerWrapperDependencies & WhookErrorHandlerDependencies,
  errorHandler: WhookErrorHandler,
): Promise<WhookErrorHandler> {
  log('warning', '🕱 - Wrapping the error handler for CORS.');

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
      log('debug', '🤷 - Unable to set custom headers to the caught error!');
      log('debug-stack', printStackTrace(err as Error));
    }
    return errorHandler(transactionId, responseSpec, err);
  };

  return wrappedErrorHandler;
}
