import initGetOpenAPI from './getOpenAPI';
import type { OpenAPIV3 } from 'openapi-types';

describe('getOpenAPI', () => {
  const API = {
    openapi: '3.0.0',
    info: {
      title: 'test',
      version: '1',
    },
    paths: {
      '/time': {
        options: {
          tags: ['public'],
          'x-whook': { memx: 2, tx: 18 },
        },
        get: {
          tags: ['public'],
          'x-whook': { memx: 2, tx: 18 },
        },
        put: {
          tags: ['private'],
          'x-whook': { private: true },
        },
      },
    },
    tags: [{ name: 'public' }, { name: 'private' }],
  } as unknown as OpenAPIV3.Document;

  const APIWithParameters = {
    openapi: '3.0.0',
    info: {
      title: 'test',
      version: '1',
    },
    paths: {
      '/time': {
        options: {
          tags: ['public'],
          'x-whook': { memx: 2, tx: 18 },
        },
        get: {
          tags: ['public'],
          'x-whook': { memx: 2, tx: 18 },
          parameters: [
            {
              in: 'query',
              name: 'queryParam',
            },
            {
              in: 'query',
              name: 'parameterToRemove',
            },
            { $ref: '#/components/parameters/xRefToRemove' },
          ],
        },
        put: {
          tags: ['private'],
          'x-whook': { private: true },
        },
      },
    },
    components: {
      parameters: {
        xRefToRemove: {
          name: 'X-Ref-To-Remove',
          in: 'header',
        },
      },
    },
    tags: [{ name: 'public' }, { name: 'private' }],
  } as unknown as OpenAPIV3.Document;

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

  it('should work with muted paramerter', async () => {
    const getOpenAPI = await initGetOpenAPI({
      API: APIWithParameters,
    });
    const response = await getOpenAPI({
      mutedParameters: ['X-Ref-To-Remove', 'parameterToRemove'],
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
