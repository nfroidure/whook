import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGetDelay from './getDelay.js';
import { type DelayService } from 'common-services';

/* Architecture Note #3.5: Testing

Since the handlers do not need to deal with
 input/ouput validity, you can just write
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

  beforeEach(() => {
    delay.create.mockReset();
    delay.clear.mockReset();
  });

  test('should work', async () => {
    delay.create.mockResolvedValueOnce(undefined);

    /* Architecture Note #3.5.2: Handler initialization
  
    To get the testable handler, you first need to
     initialize it by providing mock services.
    */
    const getDelay = await initGetDelay({
      delay,
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
    }).toMatchInlineSnapshot(`
      {
        "delayClearCalls": [],
        "delayCreateCalls": [
          [
            1000,
          ],
        ],
        "response": {
          "status": 204,
        },
      }
    `);
  });
});
