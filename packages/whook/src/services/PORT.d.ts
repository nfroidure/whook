import { LogService } from 'common-services';
export declare type PortEnv = {
  PORT?: string;
};
declare const _default: typeof initPort;
export default _default;
/**
 * Initialize the PORT service from ENV or auto-detection if
 *  none specified in ENV
 * @param  {Object}   services
 * The services PORT depends on
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<Number>}
 * A promise of a number representing the actual port.
 */
declare function initPort({
  ENV,
  log,
}: {
  ENV?: PortEnv;
  log?: LogService;
}): Promise<number>;
