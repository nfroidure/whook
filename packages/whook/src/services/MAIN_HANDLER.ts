import { autoService, name, location } from 'knifecycle';
import { noop, type LogService } from 'common-services';
import {
  applyHandlerWrappers,
  filterHandlerWrappers,
  type WhookDefinitions,
  type WhookHandlerWrapper,
} from '../index.js';

export type WhookMainDefinition = WhookDefinitions['configs'][string];

export interface WhookMainHandlerDependencies<T> {
  DEFINITIONS: WhookDefinitions;
  MAIN_DEFINITION: WhookMainDefinition;
  MAIN_WRAPPERS_ORDER?: string[];
  MAIN_WRAPPERS: Record<string, WhookHandlerWrapper<T>>;
  MAIN_WRAPPER: WhookHandlerWrapper<T>;
  BASE_HANDLER: T;
  log?: LogService;
}

/**
 * An initializer to build a single Whook handler.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}    [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the handler with
 * @param  {Object}   services.MAIN_DEFINITION
 * A definition for that handler
 * @param  {Array}    [services.MAIN_WRAPPERS_ORDER]
 * An optional array to choose wrappers application order
 * @param  {Array}    services.MAIN_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Function} services.MAIN_WRAPPER
 * The main handler wrapper
 * @param  {Function} services.BASE_HANDLER
 * The base handler
 * @param  {Function} [services.log=noop]
 * An optional logging service
 * @return {Promise<Function>}
 * A promise of the `MAIN_HANDLER` service.
 */
async function initMainHandler<T>({
  DEFINITIONS,
  MAIN_DEFINITION,
  MAIN_WRAPPERS_ORDER,
  MAIN_WRAPPERS,
  MAIN_WRAPPER,
  BASE_HANDLER,
  log = noop,
}: WhookMainHandlerDependencies<T>): Promise<T> {
  const availableRouteWrappers = Object.keys(MAIN_WRAPPERS);
  log(
    'warning',
    `🏭 - Initializing the MAIN_HANDLER service with ${
      availableRouteWrappers.length
    } wrappers available.`,
  );

  const handlerName =
    MAIN_DEFINITION.type === 'route'
      ? MAIN_DEFINITION.operation.operationId
      : MAIN_DEFINITION.name;
  const wrappersNames = filterHandlerWrappers(
    {
      DEFINITIONS,
      log,
    },
    MAIN_WRAPPERS_ORDER ?? availableRouteWrappers,
    MAIN_DEFINITION.type,
    handlerName,
  );

  log(
    'debug',
    `🏭 - Wrapping "${handlerName}" route handler with ${
      wrappersNames.length ? `"${wrappersNames.join(', ')}" wrappers and ` : ''
    }the main wrapper.`,
  );

  const wrappers = wrappersNames.map((key) => MAIN_WRAPPERS[key]);

  return await applyHandlerWrappers([...wrappers, MAIN_WRAPPER], BASE_HANDLER);
}

export default location(
  name('MAIN_HANDLER', autoService(initMainHandler)),
  import.meta.url,
);
