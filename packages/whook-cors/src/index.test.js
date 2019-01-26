import { wrapHandlerWithCORS, optionsWithCORS } from '.';

describe('wrapHandlerWithCORS', () => {
  it('should work', async () => {
    const wrappedOptionsWithCORS = wrapHandlerWithCORS(optionsWithCORS);
    const handler = await wrappedOptionsWithCORS({
      CORS: {},
    });
    const response = await handler();

    expect({
      response,
    }).toMatchSnapshot();
  });
});
