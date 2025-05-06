import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGetDelay from './getDelay.js';
import { type LogService, type DelayService } from 'common-services';

/* Architecture Note #3.5: Testing

Since the routes do not need to deal with
 input/output validity, you can just write
 tests for the business logic.
*/
describe('getDelay', () => {
  /* Architecture Note #3.5.1: Services stubs
  
  First you need to write stubs for services,
   pass it to the handler initializer and
   eventually mock their return values.
  */
  const delay = {
    create: jest.fn<DelayService['create']>(),
    clear: jest.fn<DelayService['clear']>(),
  };
  const fetcher = jest.fn<typeof fetch>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    delay.create.mockReset();
    delay.clear.mockReset();
    fetcher.mockReset();
    log.mockReset();
  });

  test('should work', async () => {
    delay.create.mockResolvedValueOnce(undefined);

    /* Architecture Note #3.5.2: Handler initialization
  
    To get the testable handler, you first need to
     initialize it by providing mock services.
    */
    const getDelay = await initGetDelay({
      delay,
      fetcher,
      log,
    });

    /* Architecture Note #3.5.3: Handler run
  
    Then run the handler and get the response.
     Here, we snapshot the response and the
     services mock calls to ensure it do not
     changes unexpectedly.
    
     This is the force of Whook's serializable
      responses. It embed only the data structure,
      no method or other OOP noisy things.
    */
    const response = await getDelay({
      query: {
        duration: 1000,
      },
    });

    expect({
      response,
      delayCreateCalls: delay.create.mock.calls,
      delayClearCalls: delay.clear.mock.calls,
      fetcherCalls: fetcher.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "delayClearCalls": [],
  "delayCreateCalls": [
    [
      1000,
    ],
  ],
  "fetcherCalls": [],
  "logCalls": [],
  "response": {
    "status": 204,
  },
}
`);
  });

  test('should work with a callback', async () => {
    delay.create.mockResolvedValueOnce(undefined);
    fetcher.mockResolvedValueOnce({ status: 204 } as Response);

    /* Architecture Note #3.5.2: Handler initialization
  
    To get the testable handler, you first need to
     initialize it by providing mock services.
    */
    const getDelay = await initGetDelay({
      delay,
      fetcher,
      log,
    });

    /* Architecture Note #3.5.3: Handler run
  
    Then run the handler and get the response.
     Here, we snapshot the response and the
     services mock calls to ensure it do not
     changes unexpectedly.
    
     This is the force of Whook's serializable
      responses. It embed only the data structure,
      no method or other OOP noisy things.
    */
    const response = await getDelay({
      query: {
        duration: 1000,
        callbackUrl: 'http://example.com/trigger?source=whook',
      },
    });

    expect({
      response,
      delayCreateCalls: delay.create.mock.calls,
      delayClearCalls: delay.clear.mock.calls,
      fetcherCalls: fetcher.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "delayClearCalls": [],
  "delayCreateCalls": [
    [
      1000,
    ],
  ],
  "fetcherCalls": [
    [
      "http://example.com/trigger?source=whook&duration=1000",
      {
        "method": "POST",
      },
    ],
  ],
  "logCalls": [],
  "response": {
    "status": 204,
  },
}
`);
  });
});
