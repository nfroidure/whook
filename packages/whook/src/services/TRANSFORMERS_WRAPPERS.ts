import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type WhookTransformerHandlerWrapper } from '../types/transformers.js';
import { type LogService } from 'common-services';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { filterWrappers } from '../libs/wrappers.js';

export const TRANSFORMER_WRAPPER_REG_EXP =
  /^(wrapTransformer)[A-Z][a-zA-Z0-9]+/;

export type WhookTransformersWrappersService = Record<
  string,
  WhookTransformerHandlerWrapper
>;
export type WhookTransformersWrappersDependencies = {
  DEFINITIONS: WhookDefinitions;
  log?: LogService;
} & WhookTransformersWrappersService;

/**
 * A simple passthrough service proxying the TRANSFORMERS_WRAPPERS.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}    services.DEFINITIONS
 * The definitions that declares wrappers to wrap the transformers with
 * @param  {Function} [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.TRANSFORMERS_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `TRANSFORMERS_WRAPPERS` hash.
 */
async function initTransformersWrappers({
  DEFINITIONS,
  log = noop,
  ...TRANSFORMERS_WRAPPERS
}: WhookTransformersWrappersDependencies): Promise<WhookTransformersWrappersService> {
  log('warning', `🏭 - Initializing the TRANSFORMERS_WRAPPERS service.`);

  const TRANSFORMERS_WRAPPERS_NAMES = filterWrappers(
    { DEFINITIONS },
    'transformer',
  );

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (
    Object.keys(TRANSFORMERS_WRAPPERS).length !==
    TRANSFORMERS_WRAPPERS_NAMES.length
  ) {
    log(
      'debug',
      `🏭 - Found inconsistencies between TRANSFORMERS_WRAPPERS (${Object.keys(
        TRANSFORMERS_WRAPPERS,
      )}) and TRANSFORMERS_WRAPPERS_NAMES (${TRANSFORMERS_WRAPPERS_NAMES}).`,
    );
  }

  return TRANSFORMERS_WRAPPERS;
}

export default location(
  service(initTransformersWrappers, 'TRANSFORMERS_WRAPPERS', [
    'DEFINITIONS',
    '?log',
  ]),
  import.meta.url,
);
