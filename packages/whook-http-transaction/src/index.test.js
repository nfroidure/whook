import StreamTest from 'streamtest';
import YError from 'yerror';
import initHTTPTransaction from './index';

function streamifyBody(response) {
  return Object.assign({}, response, {
    body: StreamTest.v2.fromChunks([JSON.stringify(response.body)]),
  });
}

describe('initHTTPTransaction', () => {
  const VERBOSE_ENVS = [];
  const ENV = {
    NODE_ENV: 'development',
  };
  const log = jest.fn();
  const time = jest.fn();
  const uniqueId = jest.fn();
  const delay = {
    create: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(() => {
    log.mockReset();
    time.mockReset();
    uniqueId.mockReset();
    delay.create.mockReset();
    delay.clear.mockReset();
  });

  test('should work', async () => {
    const httpTransaction = await initHTTPTransaction({
      ENV,
      VERBOSE_ENVS,
      log,
      time,
      delay,
      uniqueId,
    });

    expect(httpTransaction).toBeTruthy();
    expect({
      logCalls: log.mock.calls,
      timeCalls: time.mock.calls,
      uniqueIdCalls: uniqueId.mock.calls,
      delayCreateCalls: delay.create.mock.calls,
      delayClearCalls: delay.clear.mock.calls,
    }).toMatchSnapshot();
  });

  describe('httpTransaction', () => {
    const buildResponse = jest.fn();
    let res;
    let resBodyPromise;

    beforeEach(done => {
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
      delay.create.mockReturnValueOnce(new Promise(() => {}));
      delay.clear.mockResolvedValue();

      const httpTransaction = await initHTTPTransaction({
        ENV,
        VERBOSE_ENVS,
        log,
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

      const [request, transaction] = await httpTransaction(req, res);

      const response = await transaction.start(buildResponse);

      await transaction.end(response);

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
        logCalls: log.mock.calls,
        timeCalls: time.mock.calls,
        uniqueIdCalls: uniqueId.mock.calls,
        delayCreateCalls: delay.create.mock.calls,
        delayClearCalls: delay.clear.mock.calls,
      }).toMatchSnapshot();
    });

    test('should fail on timeout', async () => {
      time.mockReturnValue(new Date('2012-01-15T00:00:00.000Z').getTime());
      uniqueId.mockReturnValue('[id]');
      delay.create.mockResolvedValueOnce();
      delay.clear.mockResolvedValueOnce();

      let request;

      try {
        const httpTransaction = await initHTTPTransaction({
          ENV,
          VERBOSE_ENVS,
          log,
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

        buildResponse.mockReturnValueOnce(new Promise(() => {}));

        const [_request, transaction] = await httpTransaction(req, res);

        request = _request;

        await transaction.start(buildResponse);

        await transaction.end();

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect(err.code).toEqual('E_TRANSACTION_TIMEOUT');
        expect(err.httpCode).toEqual(504);
        expect({
          request,
          logCalls: log.mock.calls,
          timeCalls: time.mock.calls,
          uniqueIdCalls: uniqueId.mock.calls,
          delayCreateCalls: delay.create.mock.calls,
          delayClearCalls: delay.clear.mock.calls,
        }).toMatchSnapshot();
      }
    });

    test('should fail with non-unique transaction id', async () => {
      time.mockReturnValue(new Date('2012-01-15T00:00:00.000Z').getTime());
      uniqueId.mockReturnValue('[id]');
      delay.create.mockReturnValueOnce(new Promise(() => {}));
      delay.clear.mockResolvedValue();

      try {
        const httpTransaction = await initHTTPTransaction({
          ENV,
          VERBOSE_ENVS,
          log,
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

        const [, transaction] = await httpTransaction(req, res);

        await transaction
          .start(buildResponse)
          .catch(transaction.catch)
          .then(streamifyBody)
          .then(transaction.end);

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect(err.code).toEqual('E_TRANSACTION_ID_NOT_UNIQUE');
        expect(err.httpCode).toEqual(400);
        expect({
          timeCalls: time.mock.calls,
          uniqueIdCalls: uniqueId.mock.calls,
          delayCreateCalls: delay.create.mock.calls,
          delayClearCalls: delay.clear.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
