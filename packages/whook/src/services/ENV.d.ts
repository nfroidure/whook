/// <reference types="node" />
import { LogService } from 'common-services';
declare const _default: typeof initENV;
export default _default;
export declare type ENVService = {
  [name: string]: string;
};
export declare type ENVConfig = {
  NODE_ENV?: string;
  PWD?: string;
  BASE_ENV?: ENVService;
  PROCESS_ENV?: ENVService;
};
export declare type ENVDependencies = ENVConfig & {
  NODE_ENV: string;
  PWD: string;
  log?: LogService;
  readFile?: typeof _readFile;
};
/**
 * Initialize the ENV service using process env plus dotenv files
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value to lookk for `.env.${NODE_ENV}` env file
 * @param  {Object}   services.PWD
 * The process current working directory
 * @param  {Object}   [services.BASE_ENV={}]
 * An optional base environment
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the actual env vars.
 */
declare function initENV({
  NODE_ENV,
  PWD,
  BASE_ENV,
  PROCESS_ENV,
  log,
  readFile,
}: ENVDependencies): Promise<ENVService>;
declare function _readFile(path: string): Promise<Buffer>;
