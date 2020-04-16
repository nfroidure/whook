import initHTTPServer from './index';
import axios from 'axios';
import net from 'net';
import YError from 'yerror';
import type { HTTPRouterService } from '@whook/http-router';

describe('initHTTPServer', () => {
  const PORT = 7777;
  const HOST = 'localhost';
  const log = jest.fn();
  const httpRouter = jest.fn();

  beforeEach(() => {
    log.mockReset();
    httpRouter.mockReset();
  });

  test('should work with keepalive connections', async () => {
    const httpServer = await initHTTPServer({
      HOST,
      PORT,
      log,
      httpRouter: (httpRouter as unknown) as HTTPRouterService,
    });

    await httpServer.dispose();

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      httpRouterCalls: httpRouter.mock.calls,
    }).toMatchSnapshot();
  });

  test('should work with instantly destroyed connections', async () => {
    const httpServer = await initHTTPServer({
      ENV: {
        DESTROY_SOCKETS: '1',
      },
      HOST,
      PORT,
      httpRouter,
    });

    await httpServer.dispose();

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      httpRouterCalls: httpRouter.mock.calls,
    }).toMatchSnapshot();
  });

  test('should proxy server fatal errors', async () => {
    const httpServer = await initHTTPServer({
      ENV: {
        DESTROY_SOCKETS: '1',
      },
      MAX_CONNECTIONS: 4,
      HOST,
      PORT,
      httpRouter,
    });

    try {
      httpServer.service.emit('error', new YError('E_ERROR'));

      await httpServer.fatalErrorPromise;
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      await httpServer.dispose();

      expect({
        errorCode: err.code,
        errorParams: err.params,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        httpRouterCalls: httpRouter.mock.calls,
      }).toMatchSnapshot();
    }
  });

  test('should proxy server close errors', async () => {
    const httpServer = await initHTTPServer({
      ENV: {
        DESTROY_SOCKETS: '1',
      },
      MAX_CONNECTIONS: 4,
      HOST,
      PORT,
      httpRouter,
    });

    try {
      httpServer.service.close = (((realClose) => async (cb) => {
        await new Promise((resolve, reject) => {
          realClose((err) => (err && (reject(err) as any)) || resolve());
        });

        cb(new YError('E_ERROR'));
      })(
        httpServer.service.close.bind(httpServer.service),
      ) as unknown) as typeof httpServer.service.close;

      await httpServer.dispose();
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: err.code,
        errorParams: err.params,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        httpRouterCalls: httpRouter.mock.calls,
      }).toMatchSnapshot();
    }
  });

  test('should close even with opened sockets when using DESTROY_SOCKETS', async () => {
    const httpServer = await initHTTPServer({
      ENV: {
        DESTROY_SOCKETS: '1',
      },
      HOST,
      PORT,
      httpRouter,
    });

    const client = net.createConnection({
      host: HOST,
      port: PORT,
    });

    await new Promise((resolve, reject) => {
      client.on('error', reject);
      client.on('connect', resolve);
      client.write('GET / HTTP/1.1\r\n\r\n');
    });

    await httpServer.dispose();

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      httpRouterCalls: httpRouter.mock.calls,
    }).toMatchSnapshot();
  });

  test('should serve the router', async () => {
    const httpServer = await initHTTPServer({
      ENV: {
        DESTROY_SOCKETS: '1',
      },
      HOST,
      PORT,
      httpRouter: (((_, res) => {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
      }) as unknown) as HTTPRouterService,
    });

    const { status } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}/`,
      validateStatus: () => true,
    });

    await httpServer.dispose();

    expect({
      status,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
