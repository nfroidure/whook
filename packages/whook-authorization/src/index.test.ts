import { wrapHandlerWithAuthorization } from '.';
import { handler } from 'knifecycle';
import YError from 'yerror';
import {
  BEARER as BEARER_MECHANISM,
  BASIC as BASIC_MECHANISM,
} from 'http-auth-utils';
import type { Parameters, Dependencies } from 'knifecycle';
import type { WhookOperation } from '@whook/whook';

describe('wrapHandlerWithAuthorization', () => {
  const noopMock = jest.fn(
    async (_d: Dependencies, _p: Parameters, _o: WhookOperation) => ({
      status: 200,
    }),
  );
  const log = jest.fn();
  const authentication = {
    check: jest.fn(),
  };
  const NOOP_OPERATION: WhookOperation = {
    path: '/path',
    method: 'get',
    operationId: 'noopHandler',
    summary: 'Does nothing.',
    tags: ['system'],
    parameters: [],
    responses: {
      200: {
        description: 'Sucessfully did nothing!',
      },
    },
  };
  const NOOP_AUTHENTICATED_OPERATION: WhookOperation = {
    ...NOOP_OPERATION,
    security: [
      {},
      {
        bearerAuth: ['user', 'admin'],
      },
    ],
  };
  const NOOP_RESTRICTED_OPERATION: WhookOperation = {
    ...NOOP_OPERATION,
    security: [
      {
        bearerAuth: ['user', 'admin'],
      },
    ],
  };
  const BAD_OPERATION: WhookOperation = {
    ...NOOP_OPERATION,
    security: [
      {
        bearerAuth: [],
      },
    ],
  };

  beforeEach(() => {
    noopMock.mockClear();
    log.mockReset();
    authentication.check.mockReset();
  });

  describe('with unauthenticated endpoints', () => {
    it('should work', async () => {
      const noopHandler = handler(noopMock, 'getNoop');
      const wrappedNoodHandlerWithAuthorization =
        wrapHandlerWithAuthorization(noopHandler);
      const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
        authentication,
        log,
      });
      const response = await wrappedHandler({ aParameter: 1 }, NOOP_OPERATION);

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    });
  });

  describe('with authenticated but not restricted endpoints', () => {
    it('should work with bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });
      const noopHandler = handler(noopMock, 'getNoop');
      const wrappedNoodHandlerWithAuthorization =
        wrapHandlerWithAuthorization(noopHandler);
      const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
        authentication,
        log,
      });
      const response = await wrappedHandler(
        {
          authorization: 'bearer yolo',
        },
        NOOP_AUTHENTICATED_OPERATION,
      );

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    });

    it('should work with Bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });
      const noopHandler = handler(noopMock, 'getNoop');
      const wrappedNoodHandlerWithAuthorization =
        wrapHandlerWithAuthorization(noopHandler);
      const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
        authentication,
        log,
      });
      const response = await wrappedHandler(
        {
          authorization: 'Bearer yolo',
        },
        NOOP_AUTHENTICATED_OPERATION,
      );

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    });

    it('should work with access tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });
      const noopHandler = handler(noopMock, 'getNoop');
      const wrappedNoodHandlerWithAuthorization =
        wrapHandlerWithAuthorization(noopHandler);
      const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
        authentication,
        log,
      });
      const response = await wrappedHandler(
        {
          access_token: 'yolo',
        },
        NOOP_AUTHENTICATED_OPERATION,
      );

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    });

    it('should work with no authentication at all', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });
      const noopHandler = handler(noopMock, 'getNoop');
      const wrappedNoodHandlerWithAuthorization =
        wrapHandlerWithAuthorization(noopHandler);
      const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
        authentication,
        log,
      });
      const response = await wrappedHandler({}, NOOP_AUTHENTICATED_OPERATION);

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    });
  });

  describe('with authenticated and restricted endpoints', () => {
    it('should work with bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });
      const noopHandler = handler(noopMock, 'getNoop');
      const wrappedNoodHandlerWithAuthorization =
        wrapHandlerWithAuthorization(noopHandler);
      const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
        authentication,
        log,
      });
      const response = await wrappedHandler(
        {
          authorization: 'Bearer yolo',
        },
        NOOP_RESTRICTED_OPERATION,
      );

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    });

    it('should work with access tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });
      const noopHandler = handler(noopMock, 'getNoop');
      const wrappedNoodHandlerWithAuthorization =
        wrapHandlerWithAuthorization(noopHandler);
      const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
        authentication,
        log,
      });
      const response = await wrappedHandler(
        {
          access_token: 'yolo',
        },
        NOOP_RESTRICTED_OPERATION,
      );

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    });
  });

  it('should fail with no operation definition provided', async () => {
    const noopHandler = handler(noopMock, 'getNoop');
    const wrappedNoodHandlerWithAuthorization =
      wrapHandlerWithAuthorization(noopHandler);
    const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
      authentication,
      log,
    });

    try {
      await wrappedHandler(
        {
          access_token: 'yolo',
        },
        undefined,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: err.httpCode,
        errorCode: err.code,
        errorParams: err.params,
        errorHeaders: err.headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });

  it('should fail with bad operation definition provided', async () => {
    const noopHandler = handler(noopMock, 'getNoop');
    const wrappedNoodHandlerWithAuthorization =
      wrapHandlerWithAuthorization(noopHandler);
    const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
      authentication,
      log,
    });

    try {
      await wrappedHandler(
        {
          access_token: 'yolo',
        },
        BAD_OPERATION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: err.httpCode,
        errorCode: err.code,
        errorParams: err.params,
        errorHeaders: err.headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });

  it('should fail without right scopes', async () => {
    authentication.check.mockResolvedValue({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 1,
      scope: '',
    });
    const noopHandler = handler(noopMock, 'getNoop');
    const wrappedNoodHandlerWithAuthorization =
      wrapHandlerWithAuthorization(noopHandler);
    const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
      authentication,
      log,
    });

    try {
      await wrappedHandler(
        {
          authorization: 'Bearer yolo',
        },
        NOOP_RESTRICTED_OPERATION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: err.httpCode,
        errorCode: err.code,
        errorParams: err.params,
        errorHeaders: err.headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });

  it('should fail with unallowed mechanisms', async () => {
    authentication.check.mockResolvedValue({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 1,
      scope: '',
    });
    const noopHandler = handler(noopMock, 'getNoop');
    const wrappedNoodHandlerWithAuthorization =
      wrapHandlerWithAuthorization(noopHandler);
    const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
      MECHANISMS: [BASIC_MECHANISM, BEARER_MECHANISM],
      authentication,
      log,
    });

    try {
      await wrappedHandler(
        {
          authorization: 'Basic yolo',
        },
        NOOP_RESTRICTED_OPERATION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: err.httpCode,
        errorCode: err.code,
        errorParams: err.params,
        errorHeaders: err.headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });

  it('should fail with not supported auth', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = handler(noopMock, 'getNoop');
    const wrappedNoodHandlerWithAuthorization =
      wrapHandlerWithAuthorization(noopHandler);
    const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
      authentication,
      log,
    });

    try {
      await wrappedHandler(
        {
          authorization: 'Whatever yolo',
        },
        NOOP_RESTRICTED_OPERATION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: err.httpCode,
        errorCode: err.code,
        errorParams: err.params,
        errorHeaders: err.headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });

  it('should fail with no authorization at all for secured endpoints', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = handler(noopMock, 'getNoop');
    const wrappedNoodHandlerWithAuthorization =
      wrapHandlerWithAuthorization(noopHandler);
    const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
      authentication,
      log,
    });

    try {
      await wrappedHandler({}, NOOP_RESTRICTED_OPERATION);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: err.httpCode,
        errorCode: err.code,
        errorParams: err.params,
        errorHeaders: err.headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });

  it('should fail with access_token disabled', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = handler(noopMock, 'getNoop');
    const wrappedNoodHandlerWithAuthorization =
      wrapHandlerWithAuthorization(noopHandler);
    const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
      DEFAULT_MECHANISM: '',
      authentication,
      log,
    });

    try {
      await wrappedHandler(
        {
          access_token: 'yolo',
        },
        NOOP_RESTRICTED_OPERATION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: err.httpCode,
        errorCode: err.code,
        errorParams: err.params,
        errorHeaders: err.headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });

  it('should proxy authentication errors', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    authentication.check.mockRejectedValue(new YError('E_UNAUTHORIZED'));

    const noopHandler = handler(noopMock, 'getNoop');
    const wrappedNoodHandlerWithAuthorization =
      wrapHandlerWithAuthorization(noopHandler);
    const wrappedHandler = await wrappedNoodHandlerWithAuthorization({
      authentication,
      log,
    });

    try {
      await wrappedHandler(
        {
          authorization: 'Bearer yolo',
        },
        NOOP_RESTRICTED_OPERATION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: err.httpCode,
        errorCode: err.code,
        errorParams: err.params,
        errorHeaders: err.headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });
});
