import { name, autoProvider } from 'knifecycle';
import http from 'node:http';
import ms from 'ms';
import { YError } from 'yerror';
import type { Provider } from 'knifecycle';
import type { LogService } from 'common-services';
import type { WhookHTTPRouterService } from '@whook/http-router';
import type { Socket } from 'net';

export type WhookHTTPServerEnv = {
  DESTROY_SOCKETS?: string;
};
export type WhookHTTPServerOptions = Pick<
  http.Server,
  | 'timeout'
  | 'headersTimeout'
  | 'requestTimeout'
  | 'keepAliveTimeout'
  | 'maxConnections'
  | 'maxHeadersCount'
  | 'maxRequestsPerSocket'
>;
export type WhookHTTPServerConfig = {
  HOST?: string;
  PORT?: number;
  HTTP_SERVER_OPTIONS?: Partial<WhookHTTPServerOptions>;
};
export type WhookHTTPServerDependencies = WhookHTTPServerConfig & {
  ENV?: WhookHTTPServerEnv;
  HOST: string;
  PORT: number;
  httpRouter: WhookHTTPRouterService;
  log?: LogService;
};
export type WhookHTTPServerService = http.Server;
export type WhookHTTPServerProvider = Provider<WhookHTTPServerService>;

function noop() {
  return undefined;
}

const DEFAULT_ENV = {};
const DEFAULT_HTTP_SERVER_OPTIONS: WhookHTTPServerOptions = {
  maxHeadersCount: 800,
  requestTimeout: ms('5m'),
  headersTimeout: ms('1m'),
  maxRequestsPerSocket: 0,
  timeout: ms('2m'),
  keepAliveTimeout: ms('5m'),
  maxConnections: 0,
};

export default name('httpServer', autoProvider(initHTTPServer));

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
 * @param  {Object}   [services.HTTP_SERVER_OPTIONS]
 * See https://nodejs.org/docs/latest/api/http.html#class-httpserver
 * @param  {String}   services.HOST
 * The server host
 * @param  {Number}   services.PORT
 * The server port
 * @param  {Function} services.httpRouter
 * The function to run with the req/res tuple
 * @param  {Function} [services.log=noop]
 * A logging function
 * @return {Promise<HTTPServer>}
 * A promise of an object with a NodeJS HTTP server
 *  in its `service` property.
 */
async function initHTTPServer({
  ENV = DEFAULT_ENV,
  HTTP_SERVER_OPTIONS = DEFAULT_HTTP_SERVER_OPTIONS,
  HOST,
  PORT,
  httpRouter,
  log = noop,
}: WhookHTTPServerDependencies): Promise<WhookHTTPServerProvider> {
  const FINAL_HTTP_SERVER_OPTIONS: WhookHTTPServerOptions = {
    ...DEFAULT_HTTP_SERVER_OPTIONS,
    ...HTTP_SERVER_OPTIONS,
  };

  const sockets: Set<Socket> = ENV.DESTROY_SOCKETS
    ? new Set()
    : (undefined as unknown as Set<Socket>);
  /**
    @typedef HTTPServer
  */
  const httpServer = http.createServer(httpRouter);
  const listenPromise = new Promise((resolve) => {
    httpServer.listen(PORT, HOST, () => {
      log('warning', `🎙️ - HTTP Server listening at "http://${HOST}:${PORT}".`);
      resolve(httpServer);
    });
  });
  const fatalErrorPromise: Promise<void> = new Promise((_, reject) => {
    httpServer.once('error', (err) =>
      reject(YError.wrap(err as Error, 'E_HTTP_SERVER_ERROR')),
    );
  });

  httpServer.maxHeadersCount = FINAL_HTTP_SERVER_OPTIONS.maxHeadersCount;
  httpServer.requestTimeout = FINAL_HTTP_SERVER_OPTIONS.requestTimeout;
  httpServer.headersTimeout = FINAL_HTTP_SERVER_OPTIONS.headersTimeout;
  httpServer.maxRequestsPerSocket =
    FINAL_HTTP_SERVER_OPTIONS.maxRequestsPerSocket;
  httpServer.timeout = FINAL_HTTP_SERVER_OPTIONS.timeout;
  httpServer.keepAliveTimeout = FINAL_HTTP_SERVER_OPTIONS.keepAliveTimeout;
  httpServer.maxConnections = FINAL_HTTP_SERVER_OPTIONS.maxConnections;

  if (ENV.DESTROY_SOCKETS) {
    httpServer.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => {
        sockets.delete(socket);
      });
    });
  }

  return Promise.race([listenPromise, fatalErrorPromise]).then(() => ({
    service: httpServer,
    fatalErrorPromise,
    dispose: async () => {
      await new Promise<void>((resolve, reject) => {
        log('debug', '✅ - Closing HTTP server.');
        // Avoid to keepalive connections on shutdown
        httpServer.timeout = 1;
        httpServer.keepAliveTimeout = 1;
        httpServer.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          log('debug', '✔️ - HTTP server closed!');
          resolve();
        });
        if (ENV.DESTROY_SOCKETS) {
          for (const socket of sockets.values()) {
            socket.destroy();
          }
        }
      });
    },
  }));
}
