import { autoService, name } from 'knifecycle';
import { noop, applyWrappers } from '@whook/whook';
import type { WhookWrapper } from '@whook/whook';
import type { WhookHandler } from '@whook/http-transaction';
import type { LogService } from 'common-services';

export type WhookHandlerDependencies<T extends WhookHandler> = {
  WRAPPERS: WhookWrapper<T>[];
  mainWrapper: WhookWrapper<T>;
  baseHandler: T;
  log?: LogService;
};

export default name('HANDLER', autoService(initHandler));

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
async function initHandler<T extends WhookHandler>({
  WRAPPERS,
  mainWrapper,
  baseHandler,
  log = noop,
}: WhookHandlerDependencies<T>): Promise<WhookHandler<T>> {
  log(
    'warning',
    `🏭 - Initializing the HANDLER service with wrapped by ${WRAPPERS.length} wrappers.`,
  );

  return await applyWrappers<T>([...WRAPPERS, mainWrapper], baseHandler);
}
