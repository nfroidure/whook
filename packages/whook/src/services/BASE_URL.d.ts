import { ENVService } from './ENV';
import { WhookConfig } from './CONFIGS';
import { LogService } from 'common-services';
declare const _default: typeof initBaseURL;
export default _default;
/**
 * Initialize the BASE_URL service according to the HOST/PORT
 *  so that applications fallbacks to that default base URL.
 * @param  {Object}   services
 * The services BASE_URL depends on
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.CONFIG
 * The injected CONFIG value
 * @param  {Object}   [services.PROTOCOL]
 * The injected PROTOCOL value
 * @param  {Object}   services.HOST
 * The injected HOST value
 * @param  {Object}   services.PORT
 * The injected PORT value
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
declare function initBaseURL({
  ENV,
  CONFIG,
  PROTOCOL,
  HOST,
  PORT,
  log,
}: {
  ENV: ENVService;
  CONFIG: WhookConfig;
  PROTOCOL?: string;
  HOST: string;
  PORT: number;
  log?: LogService;
}): Promise<string>;
