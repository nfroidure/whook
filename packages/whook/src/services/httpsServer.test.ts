import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile as _execFile } from 'node:child_process';
import { promisify } from 'node:util';
import http2, {
  type IncomingHttpHeaders,
  type IncomingHttpStatusHeader,
} from 'node:http2';
import https from 'node:https';
import { once } from 'node:events';
import { type AddressInfo } from 'node:net';
import { type LogService } from 'common-services';
import initHTTPSServer from './httpsServer.js';
import { type WhookHTTPRouterService } from './httpRouter.js';
import {
  type WhookNodeRequest,
  type WhookNodeResponse,
} from '../types/http.js';

const execFile = promisify(_execFile);

async function createSSLCertificates() {
  const certificatesDir = await mkdtemp(join(tmpdir(), 'whook-http2-'));
  const keyPath = join(certificatesDir, 'server.key');
  const certPath = join(certificatesDir, 'server.crt');

  await execFile('openssl', [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    keyPath,
    '-out',
    certPath,
    '-subj',
    '/CN=localhost',
    '-days',
    '1',
  ]);

  const [key, cert] = await Promise.all([
    readFile(keyPath),
    readFile(certPath),
  ]);

  await rm(certificatesDir, { recursive: true, force: true });

  return { key, cert };
}

async function requestOverHTTP2(
  origin: string,
): Promise<IncomingHttpHeaders & IncomingHttpStatusHeader> {
  const client = http2.connect(origin, {
    rejectUnauthorized: false,
  });

  try {
    const request = client.request({
      ':method': 'GET',
      ':path': '/',
    });
    request.end();

    const [headers] = (await once(request, 'response')) as [
      IncomingHttpHeaders & IncomingHttpStatusHeader,
    ];

    request.resume();
    await once(request, 'end');

    return headers;
  } finally {
    client.close();
  }
}

async function requestOverHTTP1(host: string, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        host,
        port,
        method: 'GET',
        rejectUnauthorized: false,
      },
      (response) => {
        response.resume();
        response.once('end', () => {
          resolve(response.statusCode || 0);
        });
      },
    );

    request.once('error', reject);
    request.end();
  });
}

describe('initHTTPSServer', () => {
  const HOST = 'localhost';
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should serve HTTP2 requests through the compatibility API', async () => {
    const SSL_CERTIFICATES = await createSSLCertificates();
    let hasStream = false;

    const httpsServer = await initHTTPSServer({
      ENV: {
        DESTROY_SOCKETS: '1',
      },
      SSL_CERTIFICATES,
      HOST,
      PORT: 0,
      log,
      httpRouter: ((req: WhookNodeRequest, res: WhookNodeResponse) => {
        hasStream = 'stream' in req;
        res.statusCode = 200;
        res.setHeader('x-http2-stream', hasStream ? '1' : '0');
        res.end();
      }) as WhookHTTPRouterService,
    });

    try {
      const { port } = httpsServer.service.address() as AddressInfo;
      const headers = await requestOverHTTP2(`https://${HOST}:${port}`);

      expect(headers[':status']).toBe(200);
      expect(headers['x-http2-stream']).toBe('1');
      expect(hasStream).toBe(true);
      expect(typeof httpsServer.service.updateSettings).toBe('function');
    } finally {
      if (httpsServer.dispose) {
        await httpsServer.dispose();
      }
    }
  });

  test('should allow HTTP/1 clients by default', async () => {
    const SSL_CERTIFICATES = await createSSLCertificates();

    const httpsServer = await initHTTPSServer({
      ENV: {
        DESTROY_SOCKETS: '1',
      },
      SSL_CERTIFICATES,
      HOST,
      PORT: 0,
      log,
      httpRouter: ((_req: WhookNodeRequest, res: WhookNodeResponse) => {
        res.statusCode = 200;
        res.end();
      }) as WhookHTTPRouterService,
    });

    try {
      const { port } = httpsServer.service.address() as AddressInfo;
      const status = await requestOverHTTP1(HOST, port);

      expect(status).toBe(200);
    } finally {
      if (httpsServer.dispose) {
        await httpsServer.dispose();
      }
    }
  });
});
