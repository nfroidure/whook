import { autoService, name, location } from 'knifecycle';
import {
  noop,
  applyWrappers,
  type WhookAPIWrapper,
  type WhookAPIHandler,
} from '@whook/whook';
import { type LogService } from 'common-services';

export type WhookAPIHandlerDependencies<T extends WhookAPIHandler> = {
  WRAPPERS: WhookAPIWrapper[];
  mainWrapper: WhookAPIWrapper;
  baseHandler: T;
  log?: LogService;
};

export const DEFAULT_WRAPPERS = [];

export default location(
  name('HANDLER', autoService(initHandler)),
  import.meta.url,
);

/**
 * Initialize one Whook handler
 * @param  {Object}   services
 * The services `$autoload` depends on
 * @param  {Array}    services.WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.HANDLERS
 * The rest is a hash of handlers mapped by their operation id
 * @return {Promise<Function>}
 * A promise of the `HANDLERS` hash.
 */
async function initHandler<T extends WhookAPIHandler>({
  WRAPPERS = DEFAULT_WRAPPERS,
  mainWrapper,
  baseHandler,
  log = noop,
}: WhookAPIHandlerDependencies<T>): Promise<WhookAPIHandler> {
  log(
    'warning',
    `🏭 - Initializing the HANDLER service with wrapped by ${WRAPPERS.length} wrappers.`,
  );

  return await applyWrappers([...WRAPPERS, mainWrapper], baseHandler);
}
