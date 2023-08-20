/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  augmentAPIWithVersionsHeaders,
  initWrapHandlerWithVersionChecker,
} from './index.js';
import { initGetPing, initGetPingDefinition } from '@whook/whook';
import { YError } from 'yerror';
import { YHTTPError } from 'yhttperror';
import { NodeEnv } from 'application-services';
import type { AppEnvVars } from 'application-services';

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
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work with no version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler({});

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work with good api version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler({
      xApiVersion: '1.2.3',
    });

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work with good app version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler({
      xAppVersion: '3.6.0',
    });

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work with beta app version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler({
      xAppVersion: '4.0.0-beta.2',
    });

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work with good sdk version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler({
      xSdkVersion: '2.2.3',
    });

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  it('should fail with bad api version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

    try {
      await wrappedHandler({
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
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

    try {
      await wrappedHandler({
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
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

    try {
      await wrappedHandler({
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
