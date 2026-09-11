import { name, autoProvider, location } from 'knifecycle';
import http2 from 'node:http2';
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
export type WhookHTTPSServerOptions = Omit<
  http2.SecureServerOptions,
  'key' | 'cert' | 'ca'
> & {
  timeout?: number;
  headersTimeout?: number;
  requestTimeout?: number;
  keepAliveTimeout?: number;
  maxHeadersCount?: number;
  maxRequestsPerSocket?: number;
  maxConnections?: number;
};
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
export type WhookHTTPSServerService = http2.Http2SecureServer;
export type WhookHTTPSServerProvider = Provider<WhookHTTPSServerService>;

const DEFAULT_ENV = {};
export const DEFAULT_HTTPS_SERVER_OPTIONS: WhookHTTPSServerOptions = {
  allowHTTP1: true,
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

/* Architecture Note #2.12.1: HTTPS/HTTP2 Server

Alternatively you can use an HTTPS server with
 HTTP/2 support (while keeping HTTP/1 fallback).
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
 * See https://nodejs.org/docs/latest/api/http2.html#http2createsecureserveroptions-onrequesthandler
 * @param  {String}   services.HOST
 * The server host
 * @param  {Number}   services.PORT
 * The server port
 * @param  {Function} services.httpRouter
 * The function to run with the req/res tuple
 * @param  {Function} [services.log=noop]
 * A logging function
 * @return {Promise<HTTPSServer>}
 * A promise of an object with a NodeJS HTTPS/HTTP2 server
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
  const {
    timeout,
    headersTimeout,
    requestTimeout,
    maxConnections,
    maxHeadersCount,
    maxRequestsPerSocket,
    keepAliveTimeout,
    ...createSecureServerOptions
  } = FINAL_HTTPS_SERVER_OPTIONS;
  /**
    @typedef HTTPSServer
  */
  const httpsServer = http2.createSecureServer(
    {
      ...createSecureServerOptions,
      ...SSL_CERTIFICATES,
    },
    httpRouter,
  );
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
  const compatibilityHTTPSServer = httpsServer as unknown as Partial<{
    requestTimeout: number;
    headersTimeout: number;
    keepAliveTimeout: number;
    maxHeadersCount: number;
    maxRequestsPerSocket: number;
    maxConnections: number;
  }>;

  if (typeof timeout === 'number') {
    httpsServer.setTimeout(timeout);
  }
  if (typeof requestTimeout === 'number' && 'requestTimeout' in httpsServer) {
    compatibilityHTTPSServer.requestTimeout = requestTimeout;
  }
  if (typeof headersTimeout === 'number' && 'headersTimeout' in httpsServer) {
    compatibilityHTTPSServer.headersTimeout = headersTimeout;
  }
  if (typeof maxConnections === 'number' && 'maxConnections' in httpsServer) {
    compatibilityHTTPSServer.maxConnections = maxConnections;
  }
  if (typeof maxHeadersCount === 'number' && 'maxHeadersCount' in httpsServer) {
    compatibilityHTTPSServer.maxHeadersCount = maxHeadersCount;
  }
  if (
    typeof maxRequestsPerSocket === 'number' &&
    'maxRequestsPerSocket' in httpsServer
  ) {
    compatibilityHTTPSServer.maxRequestsPerSocket = maxRequestsPerSocket;
  }
  if (
    typeof keepAliveTimeout === 'number' &&
    'keepAliveTimeout' in httpsServer
  ) {
    compatibilityHTTPSServer.keepAliveTimeout = keepAliveTimeout;
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
        httpsServer.setTimeout(1);
        if ('keepAliveTimeout' in httpsServer) {
          compatibilityHTTPSServer.keepAliveTimeout = 1;
        }
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
