/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import {
  augmentAPIWithVersionsHeaders,
  initWrapHandlerWithVersionChecker,
} from './index.js';
import {
  initGetPing,
  getPingDefinition,
  type WhookAPIHandlerDefinition,
} from '@whook/whook';
import { YError } from 'yerror';
import { YHTTPError } from 'yhttperror';
import { NodeEnv } from 'application-services';
import { type AppEnvVars } from 'application-services';

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

const ENV: AppEnvVars = { NODE_ENV: NodeEnv.Test };

describe('augmentAPIWithVersionsHeaders()', () => {
  test('should work', async () => {
    expect(
      await augmentAPIWithVersionsHeaders(
        {
          openapi: '3.1.0',
          info: {
            version: '1.0.0',
            title: 'Sample Swagger',
            description: 'A sample Swagger file for testing purpose.',
          },
          paths: {
            [getPingDefinition.path]: {
              [getPingDefinition.method]: getPingDefinition.operation,
            },
          },
        },
        VERSIONS,
      ),
    ).toMatchSnapshot();
  });
});

describe('wrapHandlerWithVersionChecker()', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work with no version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        header: {},
        cookie: {},
        body: {},
        options: {},
      },
      {} as unknown as WhookAPIHandlerDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  test('should work with good api version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        header: { 'x-api-version': '1.2.3' },
        cookie: {},
        body: {},
        options: {},
      },
      {} as unknown as WhookAPIHandlerDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  test('should work with good app version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        header: { 'x-app-version': '3.6.0' },
        cookie: {},
        body: {},
        options: {},
      },
      {} as unknown as WhookAPIHandlerDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  test('should work with beta app version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        header: {
          'x-app-version': '4.0.0-beta.2',
        },
        cookie: {},
        body: {},
        options: {},
      },
      {} as unknown as WhookAPIHandlerDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  test('should work with good sdk version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        header: {
          'x-sdk-version': '2.2.3',
        },
        cookie: {},
        body: {},
        options: {},
      },
      {} as unknown as WhookAPIHandlerDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  test('should fail with bad api version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

    try {
      await wrappedHandler(
        {
          path: {},
          query: {},
          header: {
            'x-api-version': '2.2.3',
          },
          cookie: {},
          body: {},
          options: {},
        },
        {} as unknown as WhookAPIHandlerDefinition,
      );
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

  test('should fail with bad app version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

    try {
      await wrappedHandler(
        {
          path: {},
          query: {},
          header: {
            'x-app-version': '0.0.0',
          },
          cookie: {},
          body: {},
          options: {},
        },
        {} as unknown as WhookAPIHandlerDefinition,
      );
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

  test('should fail with bad sdk version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

    try {
      await wrappedHandler(
        {
          path: {},
          query: {},
          header: {
            'x-sdk-version': '0.2.3',
          },
          cookie: {},
          body: {},
          options: {},
        },
        {} as unknown as WhookAPIHandlerDefinition,
      );
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
