import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type WhookTransformerHandlerWrapper } from '../types/transformers.js';
import { type LogService } from 'common-services';

export default location(
  service(initTransformersWrappers, 'TRANSFORMERS_WRAPPERS', [
    '?TRANSFORMERS_WRAPPERS_NAMES',
    '?log',
  ]),
  import.meta.url,
);

export const TRANSFORMERS_WRAPPERS_REG_EXP =
  /^(wrapTransformer)[A-Z][a-zA-Z0-9]+/;

export type WhookTransformersWrappersService = Record<
  string,
  WhookTransformerHandlerWrapper
>;
export type WhookTransformersWrappersConfig = {
  TRANSFORMERS_WRAPPERS_NAMES?: string[];
};
export type WhookTransformersWrappersDependencies =
  WhookTransformersWrappersConfig & {
    log?: LogService;
  } & WhookTransformersWrappersService;

/**
 * A simple passthrough service proxying the TRANSFORMERS_WRAPPERS.
 * @param  {Object}   services
 * The services `TRANSFORMERS_WRAPPERS` depends on
 * @param  {Array}   [services.TRANSFORMERS_WRAPPERS_NAMES]
 * The global wrappers names to wrap the transformers with
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.TRANSFORMERS_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `TRANSFORMERS_WRAPPERS` hash.
 */
async function initTransformersWrappers({
  TRANSFORMERS_WRAPPERS_NAMES = [],
  log = noop,
  ...TRANSFORMERS_WRAPPERS
}: WhookTransformersWrappersDependencies): Promise<
  WhookTransformerHandlerWrapper[]
> {
  log('warning', `🏭 - Initializing the TRANSFORMERS_WRAPPERS service.`);

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (
    Object.keys(TRANSFORMERS_WRAPPERS).length !==
    TRANSFORMERS_WRAPPERS_NAMES.length
  ) {
    log(
      'debug',
      `🏭 - Found inconsistencies between TRANSFORMERS_WRAPPERS and TRANSFORMERS_WRAPPERS_NAMES.`,
    );
  }

  return TRANSFORMERS_WRAPPERS_NAMES.map((key) => TRANSFORMERS_WRAPPERS[key]);
}
