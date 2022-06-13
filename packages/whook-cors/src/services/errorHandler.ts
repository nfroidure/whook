import { initErrorHandler } from '@whook/http-router';
import { wrapInitializer, alsoInject, ServiceInitializer } from 'knifecycle';
import { noop } from '@whook/whook';
import { YHTTPError } from 'yhttperror';
import type { LogService } from 'common-services';
import type {
  WhookErrorHandler,
  ErrorHandlerDependencies,
} from '@whook/http-router';
import type { WhookCORSConfig } from '../index.js';
import { lowerCaseHeaders } from '@whook/whook';
import { mergeVaryHeaders } from '@whook/whook';

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
    // Test if setter is available, could produce another error if err only has a getter
    if (!isGetter(err as unknown as Record<string, unknown>, 'headers')) {
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
    }
    return errorHandler(transactionId, responseSpec, err);
  };

  return wrappedErrorHandler;
}

export function isGetter(obj: Record<string, unknown>, prop: string): boolean {
  if (typeof obj[prop] === 'undefined' || obj[prop] === null) {
    // Property not defined in obj, should be safe to write this property
    return false;
  }
  try {
    return !!Object.getOwnPropertyDescriptor(obj, prop)?.['get'];
  } catch (err) {
    // Error while getting the descriptor, should be only a get
    return true;
  }
}
