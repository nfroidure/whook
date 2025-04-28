import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type WhookTransformerHandlerWrapper,
  type WhookTransformerHandler,
} from '../types/transformers.js';
import { type JsonValue } from 'type-fest';
import { applyHandlerWrappers } from '../libs/wrappers.js';

export type WhookTransformersHandlersService = Record<
  string,
  WhookTransformerHandler<JsonValue, JsonValue>
>;
export type WhookTransformersHandlersDependencies = {
  TRANSFORMERS_WRAPPERS: WhookTransformerHandlerWrapper[];
  log?: LogService;
} & WhookTransformersHandlersService;

export default location(
  service(initTransformersHandlers, 'TRANSFORMERS_HANDLERS', [
    'TRANSFORMERS_WRAPPERS',
    'log',
  ]),
  import.meta.url,
);

/**
 * Initialize the Whook transformer handlers to know which
 *  transformer to run for a given transformer name.
 * @param  {Object}   services
 * The services `TRANSFORMERS_HANDLERS` depends on
 * @param  {Array}    services.TRANSFORMERS_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.TRANSFORMERS_HANDLERS
 * The rest is a hash of transformers handlers mapped by name
 * @return {Promise<Function>}
 * A promise of the `TRANSFORMERS_HANDLERS` hash.
 */
async function initTransformersHandlers({
  TRANSFORMERS_WRAPPERS,
  log = noop,
  ...TRANSFORMERS_HANDLERS
}: WhookTransformersHandlersDependencies): Promise<WhookTransformersHandlersService> {
  const transformersHandlersCount = Object.keys(TRANSFORMERS_HANDLERS).length;
  log(
    'warning',
    `🏭 - Initializing the TRANSFORMERS_HANDLERS service with ${transformersHandlersCount} handlers wrapped by ${TRANSFORMERS_WRAPPERS.length} wrappers.`,
  );

  if (!transformersHandlersCount) {
    log('warning', `🤷 - No transformers handlers at all.`);
  }

  if (!TRANSFORMERS_WRAPPERS.length) {
    return TRANSFORMERS_HANDLERS;
  }

  const WRAPPED_TRANSFORMERS_HANDLERS: WhookTransformersHandlersService = {};

  for (const transformerHandlerName of Object.keys(TRANSFORMERS_HANDLERS)) {
    WRAPPED_TRANSFORMERS_HANDLERS[transformerHandlerName] =
      await applyHandlerWrappers(
        TRANSFORMERS_WRAPPERS,
        TRANSFORMERS_HANDLERS[transformerHandlerName],
      );
  }

  return WRAPPED_TRANSFORMERS_HANDLERS;
}
