import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPutEchoedStream from './putEchoedStream.js';
import streamtest from 'streamtest';
import { type LogService } from 'common-services';

describe('putEchoedStream', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    const putEchoedStream = await initPutEchoedStream({
      log,
    });
    const response = await putEchoedStream({
      body: streamtest.fromChunks([
        Buffer.from('hello'),
        Buffer.from('world!'),
      ]),
    });

    const [stream, result] = streamtest.toText();

    response.body.pipe(stream);

    expect({
      response: {
        ...response,
        body: await result,
      },
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "warning",
      "📢 - Echoing "[Stream]"",
    ],
  ],
  "response": {
    "body": "helloworld!",
    "status": 201,
  },
}
`);
  });
});
