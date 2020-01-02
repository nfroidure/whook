import _internalIp from 'internal-ip';
import { LogService } from 'common-services';
declare const _default: typeof initHost;
export default _default;
export declare type HostEnv = {
  HOST?: string;
};
/**
 * Initialize the HOST service from ENV or auto-detection if
 *  none specified in ENV
 * @param  {Object}   services
 * The services HOST depends on
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
declare function initHost({
  ENV,
  log,
  internalIp,
}: {
  ENV?: HostEnv;
  log?: LogService;
  internalIp?: {
    v4: typeof _internalIp.v4;
  };
}): Promise<string>;
