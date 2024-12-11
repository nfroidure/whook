/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import { initWrapHandlerWithAuthorization } from './index.js';
import { handler } from 'knifecycle';
import { YError } from 'yerror';
import { YHTTPError } from 'yhttperror';
import {
  BEARER as BEARER_MECHANISM,
  BASIC as BASIC_MECHANISM,
} from 'http-auth-utils';
import { type Parameters, type Dependencies } from 'knifecycle';
import { type WhookOperation } from '@whook/whook';
import { type LogService } from 'common-services';
import { type AuthenticationService } from './index.js';

describe('wrapHandlerWithAuthorization', () => {
  const noopMock = jest.fn(
    async (_d: Dependencies, _p: Parameters, _o: WhookOperation) => ({
      status: 200,
    }),
  );
  const log = jest.fn<LogService>();
  const authentication = {
    check: jest.fn<AuthenticationService<any, any>['check']>(),
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
      const noopHandler = handler(noopMock as any, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler as any);
      const response = await wrappedHandler({ aParameter: 1 }, NOOP_OPERATION);

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
    [
      "debug",
      "🔓 - Public endpoint detected, letting the call pass through!",
    ],
  ],
  "noopMockCalls": [
    [
      {},
      {
        "aParameter": 1,
        "authenticated": false,
      },
      {
        "method": "get",
        "operationId": "noopHandler",
        "parameters": [],
        "path": "/path",
        "responses": {
          "200": {
            "description": "Sucessfully did nothing!",
          },
        },
        "summary": "Does nothing.",
        "tags": [
          "system",
        ],
      },
    ],
  ],
  "response": {
    "status": 200,
  },
}
`);
    });
  });

  describe('with authenticated but not restricted endpoints', () => {
    it('should work with bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });

      const noopHandler = handler(noopMock as any, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler as any);
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
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [
    [
      "bearer",
      {
        "hash": "yolo",
      },
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [
    [
      {},
      {
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
        "authorization": "bearer yolo",
      },
      {
        "method": "get",
        "operationId": "noopHandler",
        "parameters": [],
        "path": "/path",
        "responses": {
          "200": {
            "description": "Sucessfully did nothing!",
          },
        },
        "security": [
          {},
          {
            "bearerAuth": [
              "user",
              "admin",
            ],
          },
        ],
        "summary": "Does nothing.",
        "tags": [
          "system",
        ],
      },
    ],
  ],
  "response": {
    "headers": {
      "X-Authenticated": "{"applicationId":"abbacaca-abba-caca-abba-cacaabbacaca","userId":1,"scope":"user,admin"}",
    },
    "status": 200,
  },
}
`);
    });

    it('should work with Bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });

      const noopHandler = handler(noopMock as any, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler as any);
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
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [
    [
      "bearer",
      {
        "hash": "yolo",
      },
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [
    [
      {},
      {
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
        "authorization": "Bearer yolo",
      },
      {
        "method": "get",
        "operationId": "noopHandler",
        "parameters": [],
        "path": "/path",
        "responses": {
          "200": {
            "description": "Sucessfully did nothing!",
          },
        },
        "security": [
          {},
          {
            "bearerAuth": [
              "user",
              "admin",
            ],
          },
        ],
        "summary": "Does nothing.",
        "tags": [
          "system",
        ],
      },
    ],
  ],
  "response": {
    "headers": {
      "X-Authenticated": "{"applicationId":"abbacaca-abba-caca-abba-cacaabbacaca","userId":1,"scope":"user,admin"}",
    },
    "status": 200,
  },
}
`);
    });

    it('should work with access tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });

      const noopHandler = handler(noopMock as any, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler as any);
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
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [
    [
      "bearer",
      {
        "hash": "yolo",
      },
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [
    [
      {},
      {
        "access_token": "yolo",
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
      },
      {
        "method": "get",
        "operationId": "noopHandler",
        "parameters": [],
        "path": "/path",
        "responses": {
          "200": {
            "description": "Sucessfully did nothing!",
          },
        },
        "security": [
          {},
          {
            "bearerAuth": [
              "user",
              "admin",
            ],
          },
        ],
        "summary": "Does nothing.",
        "tags": [
          "system",
        ],
      },
    ],
  ],
  "response": {
    "headers": {
      "X-Authenticated": "{"applicationId":"abbacaca-abba-caca-abba-cacaabbacaca","userId":1,"scope":"user,admin"}",
    },
    "status": 200,
  },
}
`);
    });

    it('should work with no authentication at all', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });

      const noopHandler = handler(noopMock as any, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler as any);
      const response = await wrappedHandler({}, NOOP_AUTHENTICATED_OPERATION);

      expect({
        response,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
    [
      "debug",
      "🔓 - Optionally authenticated enpoint detected, letting the call pass through!",
    ],
  ],
  "noopMockCalls": [
    [
      {},
      {
        "authenticated": false,
      },
      {
        "method": "get",
        "operationId": "noopHandler",
        "parameters": [],
        "path": "/path",
        "responses": {
          "200": {
            "description": "Sucessfully did nothing!",
          },
        },
        "security": [
          {},
          {
            "bearerAuth": [
              "user",
              "admin",
            ],
          },
        ],
        "summary": "Does nothing.",
        "tags": [
          "system",
        ],
      },
    ],
  ],
  "response": {
    "status": 200,
  },
}
`);
    });
  });

  describe('with authenticated and restricted endpoints', () => {
    it('should work with bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });

      const noopHandler = handler(noopMock as any, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler as any);
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
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [
    [
      "bearer",
      {
        "hash": "yolo",
      },
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [
    [
      {},
      {
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
        "authorization": "Bearer yolo",
      },
      {
        "method": "get",
        "operationId": "noopHandler",
        "parameters": [],
        "path": "/path",
        "responses": {
          "200": {
            "description": "Sucessfully did nothing!",
          },
        },
        "security": [
          {
            "bearerAuth": [
              "user",
              "admin",
            ],
          },
        ],
        "summary": "Does nothing.",
        "tags": [
          "system",
        ],
      },
    ],
  ],
  "response": {
    "headers": {
      "X-Authenticated": "{"applicationId":"abbacaca-abba-caca-abba-cacaabbacaca","userId":1,"scope":"user,admin"}",
    },
    "status": 200,
  },
}
`);
    });

    it('should work with access tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      });

      const noopHandler = handler(noopMock as any, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler as any);
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
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [
    [
      "bearer",
      {
        "hash": "yolo",
      },
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [
    [
      {},
      {
        "access_token": "yolo",
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
      },
      {
        "method": "get",
        "operationId": "noopHandler",
        "parameters": [],
        "path": "/path",
        "responses": {
          "200": {
            "description": "Sucessfully did nothing!",
          },
        },
        "security": [
          {
            "bearerAuth": [
              "user",
              "admin",
            ],
          },
        ],
        "summary": "Does nothing.",
        "tags": [
          "system",
        ],
      },
    ],
  ],
  "response": {
    "headers": {
      "X-Authenticated": "{"applicationId":"abbacaca-abba-caca-abba-cacaabbacaca","userId":1,"scope":"user,admin"}",
    },
    "status": 200,
  },
}
`);
    });
  });

  it('should fail with no operation definition provided', async () => {
    const noopHandler = handler(noopMock as any, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

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
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "errorCode": "E_OPERATION_REQUIRED",
  "errorHeaders": {},
  "errorParams": [],
  "httpCode": 500,
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [],
}
`);
    }
  });

  it('should fail with bad operation definition provided', async () => {
    const noopHandler = handler(noopMock as any, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

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
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "errorCode": "E_MISCONFIGURATION",
  "errorHeaders": {},
  "errorParams": [
    "Bearer",
    [],
    "noopHandler",
  ],
  "httpCode": 500,
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [],
}
`);
    }
  });

  it('should fail without right scopes', async () => {
    authentication.check.mockResolvedValue({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 1,
      scope: '',
    });

    const noopHandler = handler(noopMock as any, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

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
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [
    [
      "bearer",
      {
        "hash": "yolo",
      },
    ],
  ],
  "errorCode": "E_UNAUTHORIZED",
  "errorHeaders": {},
  "errorParams": [
    "",
    [
      "user",
      "admin",
    ],
  ],
  "httpCode": 403,
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [],
}
`);
    }
  });

  it('should fail with unallowed mechanisms', async () => {
    authentication.check.mockResolvedValue({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 1,
      scope: '',
    });

    const noopHandler = handler(noopMock as any, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapHandlerWithAuthorization({
      MECHANISMS: [BASIC_MECHANISM, BEARER_MECHANISM],
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

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
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "errorCode": "E_UNALLOWED_AUTH_MECHANISM",
  "errorHeaders": {},
  "errorParams": [
    "Basic yolo",
  ],
  "httpCode": 400,
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [],
}
`);
    }
  });

  it('should fail with not supported auth', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = handler(noopMock as any, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

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
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "errorCode": "E_UNKNOWN_AUTH_MECHANISM",
  "errorHeaders": {},
  "errorParams": [
    "Whatever yolo",
  ],
  "httpCode": 400,
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [],
}
`);
    }
  });

  it('should fail with no authorization at all for secured endpoints', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = handler(noopMock as any, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

    try {
      await wrappedHandler({}, NOOP_RESTRICTED_OPERATION);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "errorCode": "E_UNAUTHORIZED",
  "errorHeaders": {
    "www-authenticate": "Bearer realm="Auth"",
  },
  "errorParams": [],
  "httpCode": 401,
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
    [
      "debug",
      "🔐 - No authorization found, locking access!",
    ],
  ],
  "noopMockCalls": [],
}
`);
    }
  });

  it('should fail with access_token disabled', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = handler(noopMock as any, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapHandlerWithAuthorization({
      DEFAULT_MECHANISM: '',
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

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
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "errorCode": "E_UNAUTHORIZED",
  "errorHeaders": {
    "www-authenticate": "Bearer realm="Auth"",
  },
  "errorParams": [],
  "httpCode": 401,
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
    [
      "debug",
      "🔐 - No authorization found, locking access!",
    ],
  ],
  "noopMockCalls": [],
}
`);
    }
  });

  it('should proxy authentication errors', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    authentication.check.mockRejectedValue(new YError('E_UNAUTHORIZED'));

    const noopHandler = handler(noopMock as any, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

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
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopMockCalls: noopMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [
    [
      "bearer",
      {
        "hash": "yolo",
      },
    ],
  ],
  "errorCode": "E_UNAUTHORIZED",
  "errorHeaders": {
    "www-authenticate": "Bearer realm="Auth"",
  },
  "errorParams": [],
  "httpCode": 401,
  "logCalls": [
    [
      "debug",
      "🔐 - Initializing the authorization wrapper.",
    ],
  ],
  "noopMockCalls": [],
}
`);
    }
  });
});
