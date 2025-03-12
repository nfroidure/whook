import { autoService, name, location } from 'knifecycle';
import { noop, type LogService } from 'common-services';
import { applyHandlerWrappers, type WhookHandlerWrapper } from '../index.js';

export type WhookMainHandlerDependencies<T> = {
  WRAPPERS: WhookHandlerWrapper<T>[];
  MAIN_WRAPPER: WhookHandlerWrapper<T>;
  BASE_HANDLER: T;
  log?: LogService;
};

export default location(
  name('MAIN_HANDLER', autoService(initMainHandler)),
  import.meta.url,
);

/**
 * An initializer to build a single Whook route handler.
 * @param  {Object}   services
 * The services `$autoload` depends on
 * @param  {Array}    services.WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Function}    services.MAIN_WRAPPER
 * The main route handle wrapper
 * @param  {Function}    services.BASE_HANDLER
 * The base handler
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Function>}
 * A promise of the `MAIN_HANDLER` service.
 */
async function initMainHandler<T>({
  WRAPPERS,
  MAIN_WRAPPER,
  BASE_HANDLER,
  log = noop,
}: WhookMainHandlerDependencies<T>): Promise<T> {
  log(
    'warning',
    `🏭 - Initializing the MAIN_HANDLER service with wrapped by ${WRAPPERS.length} wrappers.`,
  );

  return await applyHandlerWrappers([...WRAPPERS, MAIN_WRAPPER], BASE_HANDLER);
}
