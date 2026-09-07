import { name, autoProvider, location } from 'knifecycle';
import https from 'node:https';
import ms from 'ms';
import { YError } from 'yerror';
import { type Provider } from 'knifecycle';
import { noop, type LogService } from 'common-services';
import { type WhookHTTPRouterService } from './httpRouter.js';
import { type Socket } from 'net';
import { type WhookSSLCertificatesService } from './SSL_CERTIFICATES.js';

export interface WhookHTTPSServerEnv {
  DESTROY_SOCKETS?: string;
}
export type WhookHTTPSServerOptions = Pick<
  https.Server,
  | 'timeout'
  | 'headersTimeout'
  | 'requestTimeout'
  | 'keepAliveTimeout'
  | 'maxHeadersCount'
  | 'maxRequestsPerSocket'
> &
  Partial<Pick<https.Server, 'maxConnections'>>;
export interface WhookHTTPSServerConfig {
  HOST?: string;
  PORT?: number;
  HTTPS_SERVER_OPTIONS?: Partial<WhookHTTPSServerOptions>;
}
export type WhookHTTPSServerDependencies = WhookHTTPSServerConfig & {
  SSL_CERTIFICATES: WhookSSLCertificatesService;
  ENV?: WhookHTTPSServerEnv;
  HOST: string;
  PORT: number;
  httpRouter: WhookHTTPRouterService;
  log?: LogService;
};
export type WhookHTTPSServerService = https.Server;
export type WhookHTTPSServerProvider = Provider<WhookHTTPSServerService>;

const DEFAULT_ENV = {};
export const DEFAULT_HTTPS_SERVER_OPTIONS: WhookHTTPSServerOptions = {
  maxHeadersCount: 800,
  requestTimeout: ms('5m'),
  headersTimeout: ms('1m'),
  maxRequestsPerSocket: 0,
  timeout: ms('2m'),
  keepAliveTimeout: ms('5m'),
};

export default location(
  name('httpsServer', autoProvider(initHTTPSServer)),
  import.meta.url,
);

/* Architecture Note #2.12.1: HTTPS Server

Alternatively you can use an HTTPS server.
*/

/**
 * Initialize an HTTPS server
 * @name initHTTPSServer
 * @function
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   [services.ENV]
 * The process environment variables
 * @param  {String}   services.ENV.DESTROY_SOCKETS
 * Whether the server sockets would be destroyed or if the
 *  server should wait while sockets are kept alive
 * @param  {Object}   [services.SSL_CERTIFICATES]
 * An object containing the SSL certificates
 * @param  {Object}   [services.HTTPS_SERVER_OPTIONS]
 * See https://nodejs.org/docs/latest/api/http.html#class-httpserver
 * @param  {String}   services.HOST
 * The server host
 * @param  {Number}   services.PORT
 * The server port
 * @param  {Function} services.httpRouter
 * The function to run with the req/res tuple
 * @param  {Function} [services.log=noop]
 * A logging function
 * @return {Promise<HTTPSServer>}
 * A promise of an object with a NodeJS HTTPS server
 *  in its `service` property.
 */
async function initHTTPSServer({
  ENV = DEFAULT_ENV,
  SSL_CERTIFICATES,
  HTTPS_SERVER_OPTIONS = DEFAULT_HTTPS_SERVER_OPTIONS,
  HOST,
  PORT,
  httpRouter,
  log = noop,
}: WhookHTTPSServerDependencies): Promise<WhookHTTPSServerProvider> {
  const FINAL_HTTPS_SERVER_OPTIONS: WhookHTTPSServerOptions = {
    ...DEFAULT_HTTPS_SERVER_OPTIONS,
    ...HTTPS_SERVER_OPTIONS,
  };

  const sockets: Set<Socket> = ENV.DESTROY_SOCKETS
    ? new Set()
    : (undefined as unknown as Set<Socket>);
  /**
    @typedef HTTPSServer
  */
  const httpsServer = https.createServer(SSL_CERTIFICATES, httpRouter);
  const listenPromise = new Promise((resolve) => {
    httpsServer.listen(PORT, HOST, () => {
      log(
        'warning',
        `🎙️ - HTTPS Server listening at "https://${HOST}:${PORT}".`,
      );
      resolve(httpsServer);
    });
  });
  const fatalErrorPromise = new Promise<void>((_, reject) => {
    httpsServer.once('error', (err) =>
      reject(YError.wrap(err as Error, 'E_HTTPS_SERVER_ERROR')),
    );
  });

  httpsServer.maxHeadersCount = FINAL_HTTPS_SERVER_OPTIONS.maxHeadersCount;
  httpsServer.requestTimeout = FINAL_HTTPS_SERVER_OPTIONS.requestTimeout;
  httpsServer.headersTimeout = FINAL_HTTPS_SERVER_OPTIONS.headersTimeout;
  httpsServer.maxRequestsPerSocket =
    FINAL_HTTPS_SERVER_OPTIONS.maxRequestsPerSocket;
  httpsServer.timeout = FINAL_HTTPS_SERVER_OPTIONS.timeout;
  httpsServer.keepAliveTimeout = FINAL_HTTPS_SERVER_OPTIONS.keepAliveTimeout;
  if (typeof FINAL_HTTPS_SERVER_OPTIONS.maxConnections === 'number') {
    httpsServer.maxConnections = FINAL_HTTPS_SERVER_OPTIONS.maxConnections;
  }

  if (ENV.DESTROY_SOCKETS) {
    httpsServer.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => {
        sockets.delete(socket);
      });
    });
  }

  return Promise.race([listenPromise, fatalErrorPromise]).then(() => ({
    service: httpsServer,
    fatalErrorPromise,
    dispose: async () => {
      await new Promise<void>((resolve, reject) => {
        log('debug', '✅ - Closing HTTPS server.');
        // Avoid to keepalive connections on shutdown
        httpsServer.timeout = 1;
        httpsServer.keepAliveTimeout = 1;
        httpsServer.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          log('debug', '✔️ - HTTPS server closed!');
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
