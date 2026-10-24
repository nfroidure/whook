import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { type WhookTransformerHandler } from '../types/transformers.js';
import { type JsonValue } from 'type-fest';
import {
  applyHandlerWrappers,
  filterHandlerWrappers,
} from '../libs/wrappers.js';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { type WhookTransformersWrappersService } from './TRANSFORMERS_WRAPPERS.js';
import { TRANSFORMER_DECLARATION_REG_EXP } from './TRANSFORMERS_DECLARATIONS.js';

export type WhookTransformersHandlersService = Record<
  string,
  WhookTransformerHandler<JsonValue, JsonValue>
>;
export type WhookTransformersHandlersDependencies = {
  DEFINITIONS: WhookDefinitions;
  TRANSFORMERS_WRAPPERS_ORDER?: string[];
  TRANSFORMERS_WRAPPERS: WhookTransformersWrappersService;
  log?: LogService;
} & WhookTransformersHandlersService;

/**
 * Initialize the Whook transformer handlers to know which
 *  transformer to run for a given transformer name.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}    services.TRANSFORMERS_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Array}    [services.TRANSFORMERS_WRAPPERS_ORDER]
 * An optional array to choose wrappers application order
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.TRANSFORMERS_HANDLERS
 * The rest is a hash of transformers handlers mapped by name
 * @return {Promise<Function>}
 * A promise of the `TRANSFORMERS_HANDLERS` hash.
 */
async function initTransformersHandlers({
  DEFINITIONS,
  TRANSFORMERS_WRAPPERS_ORDER = undefined,
  TRANSFORMERS_WRAPPERS,
  log = noop,
  ...TRANSFORMERS_HANDLERS
}: WhookTransformersHandlersDependencies): Promise<WhookTransformersHandlersService> {
  const availableTransformerHandlers = Object.keys(
    TRANSFORMERS_HANDLERS,
  ).filter((name) => TRANSFORMER_DECLARATION_REG_EXP.test(name));
  const transformerHandlers = availableTransformerHandlers.reduce(
    (handlers, name) => ({
      ...handlers,
      [name]: TRANSFORMERS_HANDLERS[name],
    }),
    {} as WhookTransformersHandlersService,
  );
  const availableTransformerWrappers = Object.keys(TRANSFORMERS_WRAPPERS);
  log(
    'warning',
    `🏭 - Initializing the TRANSFORMERS_HANDLERS service with ${
      availableTransformerHandlers.length
    } handlers and ${availableTransformerWrappers.length} wrappers.`,
  );

  if (!availableTransformerHandlers.length) {
    log('warning', `🤷 - No transformers handlers at all.`);
  }

  if (!availableTransformerWrappers.length) {
    return transformerHandlers;
  }

  const WRAPPED_TRANSFORMERS_HANDLERS: WhookTransformersHandlersService = {};

  for (const transformerHandlerName of availableTransformerHandlers) {
    const wrappersNames = filterHandlerWrappers(
      {
        DEFINITIONS,
        log,
      },
      TRANSFORMERS_WRAPPERS_ORDER ?? availableTransformerWrappers,
      'transformer',
      transformerHandlerName,
    );

    if (wrappersNames.length === 0) {
      WRAPPED_TRANSFORMERS_HANDLERS[transformerHandlerName] =
        transformerHandlers[transformerHandlerName];
      continue;
    }

    log(
      'debug',
      `🏭 - Wrapping "${
        transformerHandlerName
      }" transformer handler with "${wrappersNames.join(', ')}" wrappers.`,
    );

    const wrappers = wrappersNames.map((key) => TRANSFORMERS_WRAPPERS[key]);

    WRAPPED_TRANSFORMERS_HANDLERS[transformerHandlerName] =
      await applyHandlerWrappers(
        wrappers,
        transformerHandlers[transformerHandlerName],
      );
  }

  return WRAPPED_TRANSFORMERS_HANDLERS;
}

export default location(
  service(initTransformersHandlers, 'TRANSFORMERS_HANDLERS', [
    'DEFINITIONS',
    '?TRANSFORMERS_WRAPPERS_ORDER',
    'TRANSFORMERS_WRAPPERS',
    '?log',
  ]),
  import.meta.url,
);
