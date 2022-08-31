import { describe, it, expect } from '@jest/globals';
import {
  augmentAPIWithVersionsHeaders,
  wrapHandlerWithVersionChecker,
} from './index.js';
import { initGetPing, initGetPingDefinition } from '@whook/whook';
import { YError } from 'yerror';
import { YHTTPError } from 'yhttperror';

const VERSIONS = [
  {
    header: 'X-API-Version',
    rule: '^1.0.0',
  },
  {
    header: 'X-SDK-Version',
    rule: '>=2.2.0',
  },
  {
    header: 'X-APP-Version',
    rule: '>=3.6.0',
  },
];

const NODE_ENV = 'test';

describe('augmentAPIWithVersionsHeaders()', () => {
  it('should work', async () => {
    expect(
      await augmentAPIWithVersionsHeaders(
        {
          openapi: '3.0.2',
          info: {
            version: '1.0.0',
            title: 'Sample Swagger',
            description: 'A sample Swagger file for testing purpose.',
          },
          paths: {
            [initGetPingDefinition.path]: {
              [initGetPingDefinition.method]: initGetPingDefinition.operation,
            },
          },
        },
        VERSIONS,
      ),
    ).toMatchSnapshot();
  });
});

describe('wrapHandlerWithVersionChecker()', () => {
  it('should work with no version headers', async () => {
    const initWrappedHandler = wrapHandlerWithVersionChecker(initGetPing);
    const handler: any = await initWrappedHandler({ NODE_ENV, VERSIONS });
    const response = await handler({});

    expect({
      response,
    }).toMatchSnapshot();
  });

  it('should work with good api version headers', async () => {
    const initWrappedHandler = wrapHandlerWithVersionChecker(initGetPing);
    const handler: any = await initWrappedHandler({ NODE_ENV, VERSIONS });
    const response = await handler({
      xApiVersion: '1.2.3',
    });

    expect({
      response,
    }).toMatchSnapshot();
  });

  it('should work with good app version headers', async () => {
    const initWrappedHandler = wrapHandlerWithVersionChecker(initGetPing);
    const handler: any = await initWrappedHandler({ NODE_ENV, VERSIONS });
    const response = await handler({
      xAppVersion: '3.6.0',
    });

    expect({
      response,
    }).toMatchSnapshot();
  });

  it('should work with beta app version headers', async () => {
    const initWrappedHandler = wrapHandlerWithVersionChecker(initGetPing);
    const handler: any = await initWrappedHandler({ NODE_ENV, VERSIONS });
    const response = await handler({
      xAppVersion: '4.0.0-beta.2',
    });

    expect({
      response,
    }).toMatchSnapshot();
  });

  it('should work with good sdk version headers', async () => {
    const initWrappedHandler = wrapHandlerWithVersionChecker(initGetPing);
    const handler: any = await initWrappedHandler({ NODE_ENV, VERSIONS });
    const response = await handler({
      xSdkVersion: '2.2.3',
    });

    expect({
      response,
    }).toMatchSnapshot();
  });

  it('should fail with bad api version headers', async () => {
    const initWrappedHandler = wrapHandlerWithVersionChecker(initGetPing);
    const handler: any = await initWrappedHandler({ NODE_ENV, VERSIONS });

    try {
      await handler({
        xApiVersion: '2.2.3',
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect((err as YHTTPError).code).toEqual('E_DEPRECATED_VERSION');
      expect((err as YHTTPError).params).toEqual([
        'X-API-Version',
        '2.2.3',
        '^1.0.0',
      ]);
      expect((err as YHTTPError).httpCode).toEqual(418);
    }
  });

  it('should fail with bad app version headers', async () => {
    const initWrappedHandler = wrapHandlerWithVersionChecker(initGetPing);
    const handler: any = await initWrappedHandler({ NODE_ENV, VERSIONS });

    try {
      await handler({
        xAppVersion: '0.0.0',
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect((err as YHTTPError).code).toEqual('E_DEPRECATED_VERSION');
      expect((err as YHTTPError).params).toEqual([
        'X-APP-Version',
        '0.0.0',
        '>=3.6.0',
      ]);
      expect((err as YHTTPError).httpCode).toEqual(418);
    }
  });

  it('should fail with bad sdk version headers', async () => {
    const initWrappedHandler = wrapHandlerWithVersionChecker(initGetPing);
    const handler: any = await initWrappedHandler({ NODE_ENV, VERSIONS });

    try {
      await handler({
        xSdkVersion: '0.2.3',
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect((err as YHTTPError).code).toEqual('E_DEPRECATED_VERSION');
      expect((err as YHTTPError).params).toEqual([
        'X-SDK-Version',
        '0.2.3',
        '>=2.2.0',
      ]);
      expect((err as YHTTPError).httpCode).toEqual(418);
    }
  });
});
