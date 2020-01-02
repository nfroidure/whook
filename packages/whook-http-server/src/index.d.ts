/// <reference types="node" />
import { Provider } from 'knifecycle';
import { LogService } from 'common-services';
import { HTTPRouterService } from '@whook/http-router';
import http from 'http';
export declare type HTTPServerEnv = {
  DESTROY_SOCKETS?: string;
};
export declare type HTTPServerConfig = {
  HOST?: string;
  PORT?: number;
  MAX_HEADERS_COUNT?: number;
  KEEP_ALIVE_TIMEOUT?: number;
  SOCKET_TIMEOUT?: number;
  MAX_CONNECTIONS?: number;
};
export declare type HTTPServerDependencies = HTTPServerConfig & {
  ENV?: HTTPServerEnv;
  HOST: string;
  PORT: number;
  httpRouter: HTTPRouterService;
  log?: LogService;
};
export declare type HTTPServerService = http.Server;
export declare type HTTPServerProvider = Provider<HTTPServerService>;
declare const _default: typeof initHTTPServer;
export default _default;
/**
 * Initialize an HTTP server
 * @name initHTTPServer
 * @function
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   [services.ENV]
 * The process environment variables
 * @param  {String}   services.ENV.DESTROY_SOCKETS
 * Whether the server sockets whould be destroyed or if the
 *  server should wait while sockets are kept alive
 * @param  {String}   services.HOST
 * The server host
 * @param  {Number}   services.PORT
 * The server port
 * @param  {Number}   [services.MAX_HEADERS_COUNT]
 * The https://nodejs.org/api/http.html#http_server_maxheaderscount
 * @param  {Number}   [services.KEEP_ALIVE_TIMEOUT]
 * See https://nodejs.org/api/http.html#http_server_keepalivetimeout
 * @param  {Number}   [services.MAX_CONNECTIONS]
 * See https://nodejs.org/api/net.html#net_server_maxconnections
 * @param  {Number}   [services.SOCKET_TIMEOUT]
 * See https://nodejs.org/api/http.html#http_server_timeout
 * @param  {Function} services.httpRouter
 * The function to run with the req/res tuple
 * @param  {Function} [services.log=noop]
 * A logging function
 * @return {Promise<HTTPServer>}
 * A promise of an object with a NodeJS HTTP server
 *  in its `service` property.
 */
declare function initHTTPServer({
  ENV,
  HOST,
  PORT,
  MAX_HEADERS_COUNT,
  KEEP_ALIVE_TIMEOUT,
  SOCKET_TIMEOUT,
  MAX_CONNECTIONS,
  httpRouter,
  log,
}: HTTPServerDependencies): Promise<HTTPServerProvider>;
