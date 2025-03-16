import { autoService } from 'knifecycle';
import { printStackTrace } from 'yerror';
import { YHTTPError } from 'yhttperror';
import {
  mergeVaryHeaders,
  lowerCaseHeaders,
  type WhookResponse,
  type WhookRouteHandler,
  type WhookRouteHandlerWrapper,
  type WhookRouteDefinition,
  type WhookRouteHandlerParameters,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';

export type WhookCORSOptions = {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Expose-Headers'?: string;
  'Access-Control-Allow-Methods'?: string;
  'Access-Control-Max-Age'?: string;
  'Access-Control-Allow-Credentials'?: 'true';
};
export type WhookCORSConfig = {
  CORS: WhookCORSOptions;
};
export type WhookCORSDependencies = WhookCORSConfig & {
  log?: LogService;
};

export type WhookCORSRouteConfig = {
  cors?:
    | {
        type: 'merge';
        value: Partial<WhookCORSOptions>;
      }
    | {
        type: 'replace';
        value: WhookCORSOptions;
      };
};

/**
 * Wrap a route handler to append CORS to response.
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   services.CORS
 * A CORS object to be added to errors responses
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
async function initWrapRouteHandlerWithCORS({
  CORS,
  log = noop,
}: WhookCORSDependencies): Promise<WhookRouteHandlerWrapper> {
  log('debug', '📥 - Initializing the CORS wrapper.');

  const wrapper = async (
    handler: WhookRouteHandler,
  ): Promise<WhookRouteHandler> => {
    const wrappedHandler = handleWithCORS.bind(null, { CORS, log }, handler);

    return wrappedHandler;
  };

  return wrapper;
}

async function handleWithCORS(
  { CORS, log = noop }: WhookCORSDependencies,
  handler: WhookRouteHandler,
  parameters: WhookRouteHandlerParameters,
  definition: WhookRouteDefinition,
): Promise<WhookResponse> {
  const operationCORSConfig = definition.config?.cors;
  const finalCORS = lowerCaseHeaders(
    operationCORSConfig && operationCORSConfig.type === 'replace'
      ? operationCORSConfig.value
      : operationCORSConfig && operationCORSConfig.type === 'merge'
        ? {
            ...CORS,
            ...operationCORSConfig.value,
          }
        : CORS,
  );

  try {
    const response = await handler(parameters, definition);

    return {
      ...response,
      headers: {
        ...(response.headers || {}),
        ...finalCORS,
        vary: mergeVaryHeaders((response.headers || {}).vary || '', 'Origin'),
      },
    };
  } catch (err) {
    try {
      // Try to set custom headers, could fail if err only has a getter
      (err as YHTTPError).headers = {
        ...finalCORS,
        vary: 'Origin',
      };
    } catch (err) {
      log('debug', '🤷 - Unable to set custom headers to the catched error!');
      log('debug-stack', printStackTrace(err as Error));
    }
    throw err;
  }
}

export default autoService(initWrapRouteHandlerWithCORS);
