/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import StreamTest from 'streamtest';
import { YError } from 'yerror';
import initHTTPTransaction from './httpTransaction.js';
import { type WhookHandler, type WhookResponse } from './httpTransaction.js';
import { type WhookAPMService } from './apm.js';
import { type WhookObfuscatorService } from './obfuscator.js';
import { type IncomingMessage } from 'node:http';
import {
  type LogService,
  type TimeService,
  type DelayService,
} from 'common-services';

function streamifyBody(response) {
  return Object.assign({}, response, {
    body: StreamTest.v2.fromChunks([JSON.stringify(response.body)]),
  });
}

describe('initHTTPTransaction', () => {
  const log = jest.fn<LogService>();
  const apm = jest.fn<WhookAPMService>();
  const time = jest.fn<TimeService>();
  const uniqueId = jest.fn<() => string>();
  const delay = {
    create: jest.fn<DelayService['create']>(),
    clear: jest.fn<DelayService['clear']>(),
  };
  const obfuscator = {
    obfuscate: jest.fn<WhookObfuscatorService['obfuscate']>(),
    obfuscateSensibleProps:
      jest.fn<WhookObfuscatorService['obfuscateSensibleProps']>(),
    obfuscateSensibleHeaders:
      jest.fn<WhookObfuscatorService['obfuscateSensibleHeaders']>(),
  };

  beforeEach(() => {
    log.mockReset();
    apm.mockReset();
    time.mockReset();
    uniqueId.mockReset();
    delay.create.mockReset();
    delay.clear.mockReset();
    obfuscator.obfuscate.mockReset();
    obfuscator.obfuscateSensibleProps.mockReset();
    obfuscator.obfuscateSensibleHeaders.mockReset();
  });

  test('should work', async () => {
    const httpTransaction = await initHTTPTransaction({
      obfuscator,
      log,
      apm,
      time,
      delay,
      uniqueId,
    });

    expect(httpTransaction).toBeTruthy();
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      apmCalls: apm.mock.calls,
      timeCalls: time.mock.calls,
      uniqueIdCalls: uniqueId.mock.calls,
      delayCreateCalls: delay.create.mock.calls,
      delayClearCalls: delay.clear.mock.calls,
      obfuscateCalls: obfuscator.obfuscate.mock.calls,
      obfuscateSensiblePropsCalls: obfuscator.obfuscateSensibleProps.mock.calls,
      obfuscateSensibleHeadersCalls:
        obfuscator.obfuscateSensibleHeaders.mock.calls,
    }).toMatchSnapshot();
  });

  describe('httpTransaction', () => {
    const buildResponse = jest.fn<any>();
    let res;
    let resBodyPromise;

    beforeEach((done) => {
      buildResponse.mockReset();
      resBodyPromise = new Promise((resolve, reject) => {
        res = StreamTest.v2.toText((err, text) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(text);
        });
        res.writeHead = jest.fn();
        done();
      });
    });

    test('should work', async () => {
      time.mockReturnValue(new Date('2012-01-15T00:00:00.000Z').getTime());
      uniqueId.mockReturnValue('[id]');
      delay.create.mockReturnValueOnce(new Promise(() => undefined));
      delay.clear.mockResolvedValue(undefined);

      const httpTransaction = await initHTTPTransaction({
        obfuscator,
        log,
        apm,
        time,
        delay,
        uniqueId,
      });
      const req = {
        connection: { encrypted: true },
        ts: 1000000,
        ip: '127.0.0.1',
        method: 'GET',
        url: '/v1/users/1?extended=true',
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
        socket: {
          bytesRead: 16,
          bytesWritten: 64,
        },
      };

      buildResponse.mockResolvedValueOnce({
        body: StreamTest.v2.fromChunks([
          JSON.stringify({
            id: 1,
            name: 'John Doe',
          }),
        ]),
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      });

      const { request, transaction } = await httpTransaction(
        req as unknown as IncomingMessage,
        res,
      );

      const response = await transaction.start(
        buildResponse as unknown as WhookHandler,
      );

      await transaction.end(response, 'theOperationId');

      expect(request.url).toEqual('/v1/users/1?extended=true');
      expect(request.method).toEqual('get');
      expect(request.headers).toEqual({
        'x-forwarded-for': '127.0.0.1',
      });
      expect(request.body).toEqual(req);
      expect(res.writeHead.mock.calls).toEqual([
        [
          200,
          'OK',
          {
            'Content-Type': 'application/json',
            'Transaction-Id': '[id]',
          },
        ],
      ]);

      const text = await resBodyPromise;

      expect(text).toEqual('{"id":1,"name":"John Doe"}');
      expect({
        request,
        buildResponseCalls: buildResponse.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        apmCalls: apm.mock.calls,
        timeCalls: time.mock.calls,
        uniqueIdCalls: uniqueId.mock.calls,
        delayCreateCalls: delay.create.mock.calls,
        delayClearCalls: delay.clear.mock.calls,
        obfuscateCalls: obfuscator.obfuscate.mock.calls,
        obfuscateSensiblePropsCalls:
          obfuscator.obfuscateSensibleProps.mock.calls,
        obfuscateSensibleHeadersCalls:
          obfuscator.obfuscateSensibleHeaders.mock.calls,
      }).toMatchSnapshot();
    });

    test('should fail on timeout', async () => {
      time.mockReturnValue(new Date('2012-01-15T00:00:00.000Z').getTime());
      uniqueId.mockReturnValue('[id]');
      delay.create.mockResolvedValueOnce(undefined);
      delay.clear.mockResolvedValueOnce(undefined);

      let request;

      try {
        const httpTransaction = await initHTTPTransaction({
          obfuscator,
          log,
          apm,
          time,
          delay,
          uniqueId,
        });
        const req = {
          connection: { encrypted: true },
          ts: 1000000,
          ip: '127.0.0.1',
          method: 'GET',
          url: '/v1/users/1?extended=true',
          headers: {
            'x-forwarded-for': '127.0.0.1',
          },
          socket: {
            bytesRead: 16,
            bytesWritten: 64,
          },
        };

        buildResponse.mockReturnValueOnce(new Promise(() => undefined));

        const { request: _request, transaction } = await httpTransaction(
          req as unknown as IncomingMessage,
          res,
        );

        request = _request;

        await transaction.start(buildResponse as unknown as WhookHandler);

        await transaction.end({} as WhookResponse);

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect((err as any).code).toEqual('E_TRANSACTION_TIMEOUT');
        expect((err as any).httpCode).toEqual(504);
        expect({
          request,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          apmCalls: apm.mock.calls,
          timeCalls: time.mock.calls,
          uniqueIdCalls: uniqueId.mock.calls,
          delayCreateCalls: delay.create.mock.calls,
          delayClearCalls: delay.clear.mock.calls,
          obfuscateCalls: obfuscator.obfuscate.mock.calls,
          obfuscateSensiblePropsCalls:
            obfuscator.obfuscateSensibleProps.mock.calls,
          obfuscateSensibleHeadersCalls:
            obfuscator.obfuscateSensibleHeaders.mock.calls,
        }).toMatchSnapshot();
      }
    });

    test('should fail with non-unique transaction id', async () => {
      time.mockReturnValue(new Date('2012-01-15T00:00:00.000Z').getTime());
      uniqueId.mockReturnValue('[id]');
      delay.create.mockReturnValueOnce(new Promise(() => undefined));
      delay.clear.mockResolvedValue(undefined);

      try {
        const httpTransaction = await initHTTPTransaction({
          obfuscator,
          log,
          apm,
          time,
          delay,
          uniqueId,
          TRANSACTIONS: { lol: {} },
        });
        const req = {
          connection: { encrypted: true },
          ts: 1000000,
          ip: '127.0.0.1',
          method: 'GET',
          url: '/v1/users/1?extended=true',
          headers: {
            'x-forwarded-for': '127.0.0.1',
            'transaction-id': 'lol',
          },
          socket: {
            bytesRead: 16,
            bytesWritten: 64,
          },
        };

        buildResponse.mockReturnValueOnce(Promise.resolve());

        const { transaction } = await httpTransaction(
          req as unknown as IncomingMessage,
          res,
        );

        await transaction
          .start(buildResponse as unknown as WhookHandler)
          .catch(transaction.catch)
          .then(streamifyBody)
          .then(transaction.end);

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect((err as any).code).toEqual('E_TRANSACTION_ID_NOT_UNIQUE');
        expect((err as any).httpCode).toEqual(400);
        expect({
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          timeCalls: time.mock.calls,
          uniqueIdCalls: uniqueId.mock.calls,
          delayCreateCalls: delay.create.mock.calls,
          delayClearCalls: delay.clear.mock.calls,
          obfuscateCalls: obfuscator.obfuscate.mock.calls,
          obfuscateSensiblePropsCalls:
            obfuscator.obfuscateSensibleProps.mock.calls,
          obfuscateSensibleHeadersCalls:
            obfuscator.obfuscateSensibleHeaders.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
