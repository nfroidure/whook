/// <reference types="node" />
/// <reference types="jest" />
import { LogService } from 'common-services';
declare const _require: NodeRequire;
export interface CONFIGSService {
  [name: string]: any;
}
export interface WhookConfig {
  name: string;
  description?: string;
  baseURL?: string;
}
declare const _default: typeof initCONFIGS;
export default _default;
/**
 * Initialize the CONFIGS service according to the NODE_ENV
 * @param  {Object}   services
 * The services CONFIGS depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
 * @param  {Object}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a an object the actual configuration properties.
 */
declare function initCONFIGS({
  PROJECT_SRC,
  NODE_ENV,
  log,
  require,
}: {
  PROJECT_SRC: string;
  NODE_ENV: string;
  log?: LogService;
  require?: typeof _require;
}): Promise<CONFIGSService>;
