import initGetOpenAPI from './getOpenAPI';

describe('getOpenAPI', () => {
  const API = {
    swagger: '2.0',
    paths: {
      '/time': {
        get: {
          tags: ['public'],
          'x-whook': { memx: 2, tx: 18 },
        },
        put: {
          tags: [],
          'x-whook': { private: true },
        },
      },
    },
  };

  it('should work', async () => {
    const getOpenAPI = await initGetOpenAPI({
      API,
    });
    const response = await getOpenAPI({});

    expect({
      response: {
        ...response,
        body: {
          ...response.body,
          info: {
            ...response.body.info,
            version: '<already_tested>',
          },
        },
      },
    }).toMatchSnapshot();
  });

  it('should show every endpoints when authenticated', async () => {
    const getOpenAPI = await initGetOpenAPI({
      API,
    });
    const response = await getOpenAPI({
      authenticated: true,
    });

    expect({
      response: {
        ...response,
        body: {
          ...response.body,
          info: {
            ...response.body.info,
            version: '<already_tested>',
          },
        },
      },
    }).toMatchSnapshot();
  });
});
