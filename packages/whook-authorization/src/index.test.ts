import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { initWrapRouteHandlerWithAuthorization } from './index.js';
import {
  service,
  type Dependencies,
  type ServiceInitializer,
} from 'knifecycle';
import { YError } from 'yerror';
import { YHTTPError } from 'yhttperror';
import {
  BEARER as BEARER_MECHANISM,
  BASIC as BASIC_MECHANISM,
} from 'http-auth-utils';
import {
  type WhookRouteHandler,
  type WhookRouteDefinition,
} from '@whook/whook';
import { type LogService } from 'common-services';
import {
  type WhookAuthenticationData,
  type WhookAuthenticationService,
} from './wrappers/wrapRouteHandlerWithAuthorization.js';

describe('wrapRouteHandlerWithAuthorization', () => {
  const noopHandlerMock = jest.fn<WhookRouteHandler>(async () => ({
    status: 200,
  }));
  const noopInitializerMock = jest.fn<
    ServiceInitializer<Dependencies, WhookRouteHandler>
  >(async () => noopHandlerMock);
  const log = jest.fn<LogService>();
  const authentication = {
    check: jest.fn<WhookAuthenticationService<unknown>['check']>(),
  };
  const NOOP_DEFINITION: WhookRouteDefinition = {
    path: '/path',
    method: 'get',
    operation: {
      operationId: 'noopHandler',
      summary: 'Does nothing.',
      tags: ['system'],
      parameters: [],
      responses: {
        200: {
          description: 'Successfully did nothing!',
        },
      },
    },
  };
  const NOOP_AUTHENTICATED_DEFINITION: WhookRouteDefinition = {
    ...NOOP_DEFINITION,
    operation: {
      ...NOOP_DEFINITION.operation,
      security: [
        {},
        {
          bearerAuth: ['user', 'admin'],
        },
      ],
    },
  };
  const NOOP_RESTRICTED_DEFINITION: WhookRouteDefinition = {
    ...NOOP_DEFINITION,
    operation: {
      ...NOOP_DEFINITION.operation,
      security: [
        {
          bearerAuth: ['user', 'admin'],
        },
      ],
    },
  };
  const BAD_DEFINITION: WhookRouteDefinition = {
    ...NOOP_DEFINITION,
    operation: {
      ...NOOP_DEFINITION.operation,
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  };

  beforeEach(() => {
    noopHandlerMock.mockClear();
    noopInitializerMock.mockClear();
    log.mockReset();
    authentication.check.mockReset();
  });

  describe('with unauthenticated endpoints', () => {
    test('should work', async () => {
      const noopHandler = service(noopInitializerMock, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapRouteHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler);
      const response = await wrappedHandler(
        {
          headers: {},
          cookies: {},
          path: {},
          query: { aParameter: 1 },
        },
        NOOP_DEFINITION,
      );

      expect({
        response,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [
    [
      {
        "authenticated": false,
        "cookies": {},
        "headers": {},
        "path": {},
        "query": {
          "aParameter": 1,
        },
      },
      {
        "method": "get",
        "operation": {
          "operationId": "noopHandler",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Successfully did nothing!",
            },
          },
          "summary": "Does nothing.",
          "tags": [
            "system",
          ],
        },
        "path": "/path",
      },
    ],
  ],
  "noopInitializerMockCalls": [
    [
      {},
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
    test('should work with bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      } as WhookAuthenticationData);

      const noopHandler = service(noopInitializerMock, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapRouteHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler);
      const response = await wrappedHandler(
        {
          headers: {
            authorization: 'bearer yolo',
          },
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_AUTHENTICATED_DEFINITION,
      );

      expect({
        response,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [
    [
      {
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
        "cookies": {},
        "headers": {
          "authorization": "bearer yolo",
        },
        "path": {},
        "query": {},
      },
      {
        "method": "get",
        "operation": {
          "operationId": "noopHandler",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Successfully did nothing!",
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
        "path": "/path",
      },
    ],
  ],
  "noopInitializerMockCalls": [
    [
      {},
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

    test('should work with Bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      } as WhookAuthenticationData);

      const noopHandler = service(noopInitializerMock, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapRouteHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler);
      const response = await wrappedHandler(
        {
          headers: {
            authorization: 'Bearer yolo',
          },
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_AUTHENTICATED_DEFINITION,
      );

      expect({
        response,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [
    [
      {
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
        "cookies": {},
        "headers": {
          "authorization": "Bearer yolo",
        },
        "path": {},
        "query": {},
      },
      {
        "method": "get",
        "operation": {
          "operationId": "noopHandler",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Successfully did nothing!",
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
        "path": "/path",
      },
    ],
  ],
  "noopInitializerMockCalls": [
    [
      {},
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

    test('should work with access tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      } as WhookAuthenticationData);

      const noopHandler = service(noopInitializerMock, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapRouteHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler);
      const response = await wrappedHandler(
        {
          headers: {},
          cookies: {},
          path: {},
          query: {
            access_token: 'yolo',
          },
        },
        NOOP_AUTHENTICATED_DEFINITION,
      );

      expect({
        response,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [
    [
      {
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
        "cookies": {},
        "headers": {},
        "path": {},
        "query": {
          "access_token": "yolo",
        },
      },
      {
        "method": "get",
        "operation": {
          "operationId": "noopHandler",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Successfully did nothing!",
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
        "path": "/path",
      },
    ],
  ],
  "noopInitializerMockCalls": [
    [
      {},
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

    test('should work with no authentication at all', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      } as WhookAuthenticationData);

      const noopHandler = service(noopInitializerMock, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapRouteHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler);
      const response = await wrappedHandler(
        {
          headers: {},
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_AUTHENTICATED_DEFINITION,
      );

      expect({
        response,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [
    [
      {
        "authenticated": false,
        "cookies": {},
        "headers": {},
        "path": {},
        "query": {},
      },
      {
        "method": "get",
        "operation": {
          "operationId": "noopHandler",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Successfully did nothing!",
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
        "path": "/path",
      },
    ],
  ],
  "noopInitializerMockCalls": [
    [
      {},
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
    test('should work with bearer tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      } as WhookAuthenticationData);

      const noopHandler = service(noopInitializerMock, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapRouteHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler);
      const response = await wrappedHandler(
        {
          headers: {
            authorization: 'Bearer yolo',
          },
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_RESTRICTED_DEFINITION,
      );

      expect({
        response,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [
    [
      {
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
        "cookies": {},
        "headers": {
          "authorization": "Bearer yolo",
        },
        "path": {},
        "query": {},
      },
      {
        "method": "get",
        "operation": {
          "operationId": "noopHandler",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Successfully did nothing!",
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
        "path": "/path",
      },
    ],
  ],
  "noopInitializerMockCalls": [
    [
      {},
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

    test('should work with access tokens and good authentication check', async () => {
      authentication.check.mockResolvedValue({
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 1,
        scope: 'user,admin',
      } as WhookAuthenticationData);

      const noopHandler = service(noopInitializerMock, 'getNoop');
      const baseHandler = await noopHandler({});
      const wrapper = await initWrapRouteHandlerWithAuthorization({
        authentication,
        log,
      });
      const wrappedHandler = await wrapper(baseHandler);
      const response = await wrappedHandler(
        {
          headers: {},
          cookies: {},
          path: {},
          query: {
            access_token: 'yolo',
          },
        },
        NOOP_RESTRICTED_DEFINITION,
      );

      expect({
        response,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [
    [
      {
        "authenticated": true,
        "authenticationData": {
          "applicationId": "abbacaca-abba-caca-abba-cacaabbacaca",
          "scope": "user,admin",
          "userId": 1,
        },
        "cookies": {},
        "headers": {},
        "path": {},
        "query": {
          "access_token": "yolo",
        },
      },
      {
        "method": "get",
        "operation": {
          "operationId": "noopHandler",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Successfully did nothing!",
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
        "path": "/path",
      },
    ],
  ],
  "noopInitializerMockCalls": [
    [
      {},
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

  test('should fail with no operation definition provided', async () => {
    const noopHandler = service(noopInitializerMock, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapRouteHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          headers: {},
          cookies: {},
          path: {},
          query: {
            access_token: 'yolo',
          },
        },
        undefined as unknown as WhookRouteDefinition,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [],
  "noopInitializerMockCalls": [
    [
      {},
    ],
  ],
}
`);
    }
  });

  test('should fail with bad operation definition provided', async () => {
    const noopHandler = service(noopInitializerMock, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapRouteHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          headers: {},
          cookies: {},
          path: {},
          query: {
            access_token: 'yolo',
          },
        },
        BAD_DEFINITION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [],
  "noopInitializerMockCalls": [
    [
      {},
    ],
  ],
}
`);
    }
  });

  test('should fail without right scopes', async () => {
    authentication.check.mockResolvedValue({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 1,
      scope: '',
    } as WhookAuthenticationData);

    const noopHandler = service(noopInitializerMock, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapRouteHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          headers: {
            authorization: 'Bearer yolo',
          },
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_RESTRICTED_DEFINITION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [],
  "noopInitializerMockCalls": [
    [
      {},
    ],
  ],
}
`);
    }
  });

  test('should fail with unallowed mechanisms', async () => {
    authentication.check.mockResolvedValue({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 1,
      scope: '',
    } as WhookAuthenticationData);

    const noopHandler = service(noopInitializerMock, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapRouteHandlerWithAuthorization({
      MECHANISMS: [BASIC_MECHANISM, BEARER_MECHANISM],
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          headers: {
            authorization: 'Basic yolo',
          },
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_RESTRICTED_DEFINITION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
        authenticationChecks: authentication.check.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "authenticationChecks": [],
  "errorCode": "E_AUTH_MECHANISM_NOT_ALLOWED",
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
  "noopHandlerMockCalls": [],
  "noopInitializerMockCalls": [
    [
      {},
    ],
  ],
}
`);
    }
  });

  test('should fail with not supported auth', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = service(noopInitializerMock, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapRouteHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          headers: {
            authorization: 'Whatever yolo',
          },
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_RESTRICTED_DEFINITION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [],
  "noopInitializerMockCalls": [
    [
      {},
    ],
  ],
}
`);
    }
  });

  test('should fail with no authorization at all for secured endpoints', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = service(noopInitializerMock, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapRouteHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          headers: {},
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_RESTRICTED_DEFINITION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [],
  "noopInitializerMockCalls": [
    [
      {},
    ],
  ],
}
`);
    }
  });

  test('should fail with access_token disabled', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    const noopHandler = service(noopInitializerMock, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapRouteHandlerWithAuthorization({
      DEFAULT_MECHANISM: '',
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          headers: {},
          cookies: {},
          path: {},
          query: {
            access_token: 'yolo',
          },
        },
        NOOP_RESTRICTED_DEFINITION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [],
  "noopInitializerMockCalls": [
    [
      {},
    ],
  ],
}
`);
    }
  });

  test('should proxy authentication errors', async () => {
    authentication.check.mockRejectedValue(
      new YError('E_UNEXPECTED_TOKEN_CHECK'),
    );

    authentication.check.mockRejectedValue(new YError('E_UNAUTHORIZED'));

    const noopHandler = service(noopInitializerMock, 'getNoop');
    const baseHandler = await noopHandler({});
    const wrapper = await initWrapRouteHandlerWithAuthorization({
      authentication,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          headers: {
            authorization: 'Bearer yolo',
          },
          cookies: {},
          path: {},
          query: {},
        },
        NOOP_RESTRICTED_DEFINITION,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        httpCode: (err as YHTTPError).httpCode,
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        errorHeaders: (err as YHTTPError).headers,
        noopInitializerMockCalls: noopInitializerMock.mock.calls,
        noopHandlerMockCalls: noopHandlerMock.mock.calls,
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
  "noopHandlerMockCalls": [],
  "noopInitializerMockCalls": [
    [
      {},
    ],
  ],
}
`);
    }
  });
});
