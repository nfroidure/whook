/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  jest,
  expect,
} from '@jest/globals';
import {
  runProcess,
  prepareProcess,
  prepareEnvironment as basePrepareEnvironment,
  DEFAULT_ERRORS_DESCRIPTORS,
  initRoutesWrappers,
  initRoutesHandlers,
} from '@whook/whook';
import {
  AUTHORIZATION_ERRORS_DESCRIPTORS,
  initWrapRouteHandlerWithAuthorization,
} from '@whook/authorization';
import { alsoInject, constant, initializer } from 'knifecycle';
import axios from 'axios';
import { YError } from 'yerror';
import {
  BEARER as BEARER_MECHANISM,
  BASIC as BASIC_MECHANISM,
} from 'http-auth-utils';
import {
  initGetOAuth2Authorize,
  getOAuth2AuthorizeDefinition,
  getOAuth2AuthorizeResponseTypeParameter,
  getOAuth2AuthorizeClientIdParameter,
  getOAuth2AuthorizeRedirectURIParameter,
  getOAuth2AuthorizeScopeParameter,
  getOAuth2AuthorizeStateParameter,
  getOAuth2AuthorizeRequestURIParameter,
  getOAuth2AuthorizeScopeSchema,
  getOAuth2AuthorizeRequestURISchema,
  getOAuth2AuthorizeCodeChallengeSchema,
  getOAuth2AuthorizeCodeChallengeParameter,
  getOAuth2AuthorizeCodeChallengeMethodSchema,
  getOAuth2AuthorizeCodeChallengeMethodParameter,
  initPostOAuth2Acknowledge,
  postOAuth2AcknowledgeDefinition,
  initPostOAuth2Token,
  postOAuth2TokenCodeVerifierSchema,
  postOAuth2TokenDefinition,
  OAUTH2_ERRORS_DESCRIPTORS,
  initOAuth2AuthorizationCodeGranter,
  initOAuth2PasswordGranter,
  initOAuth2RefreshTokenGranter,
  initOAuth2Granters,
  initOAuth2ClientCredentialsGranter,
  initOAuth2ImplicitGranter,
  postOAuth2TokenAuthorizationCodeTokenRequestBodySchema,
  postOAuth2TokenPasswordTokenRequestBodySchema,
  postOAuth2TokenClientCredentialsTokenRequestBodySchema,
  postOAuth2TokenTokenBodySchema,
  postOAuth2TokenRefreshTokenRequestBodySchema,
  postOAuth2PushedAuthorizationRequestBodySchema,
  postOAuth2PushedAuthorizationRequestDefinition,
  postOAuth2PushedAuthorizationRequestRequestURISchema,
  initPostOAuth2PushedAuthorizationRequest,
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2PasswordService,
  type WhookOAuth2AuthorizationCodeService,
  type WhookOAuth2RefreshTokenService,
  type WhookOAuth2AccessTokenService,
} from './index.js';
import { type Knifecycle } from 'knifecycle';
import { type OpenAPI } from 'ya-open-api-types';
import { type Logger } from 'common-services';
import { type WhookAuthenticationService } from '@whook/authorization';
import {
  type WhookOAuth2AuthorizationRequestsOptions,
  type WhookOAuth2AuthorizationRequestsService,
} from './services/oAuth2AuthorizationRequests.js';

describe('OAuth2 server', () => {
  const BASE_PATH = '/v1';
  const PORT = 4444;
  const HOST = 'localhost';
  const logger = {
    output: jest.fn<Logger['output']>(),
    error: jest.fn<Logger['error']>(),
    debug: jest.fn<Logger['debug']>(),
  };
  const time = jest.fn();
  const $autoload = jest.fn();

  const API: OpenAPI = {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [`${BASE_PATH}${getOAuth2AuthorizeDefinition.path}`]: {
        [getOAuth2AuthorizeDefinition.method]:
          getOAuth2AuthorizeDefinition.operation,
      },
      [`${BASE_PATH}${postOAuth2AcknowledgeDefinition.path}`]: {
        [postOAuth2AcknowledgeDefinition.method]: {
          ...postOAuth2AcknowledgeDefinition.operation,
          security: [
            {
              bearerAuth: ['user'],
            },
          ],
        },
      },
      [`${BASE_PATH}${postOAuth2TokenDefinition.path}`]: {
        [postOAuth2TokenDefinition.method]: {
          ...postOAuth2TokenDefinition.operation,
          security: [
            {
              basicAuth: ['oauth'],
            },
          ],
        },
      },
      [`${BASE_PATH}${postOAuth2PushedAuthorizationRequestDefinition.path}`]: {
        [postOAuth2PushedAuthorizationRequestDefinition.method]: {
          ...postOAuth2PushedAuthorizationRequestDefinition.operation,
          security: [
            {
              basicAuth: ['oauth'],
            },
          ],
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          description: 'Bearer authentication with a user API token',
          scheme: 'bearer',
        },
        basicAuth: {
          type: 'http',
          description: 'Basic authentication of an API client',
          scheme: 'basic',
        },
      },
      parameters: [
        getOAuth2AuthorizeResponseTypeParameter,
        getOAuth2AuthorizeClientIdParameter,
        getOAuth2AuthorizeRedirectURIParameter,
        getOAuth2AuthorizeScopeParameter,
        getOAuth2AuthorizeStateParameter,
        getOAuth2AuthorizeRequestURIParameter,
        getOAuth2AuthorizeCodeChallengeParameter,
        getOAuth2AuthorizeCodeChallengeMethodParameter,
      ].reduce(
        (parametersHash, { name, parameter }) => ({
          ...parametersHash,
          [name]: parameter,
        }),
        {},
      ),
      schemas: [
        getOAuth2AuthorizeScopeSchema,
        getOAuth2AuthorizeRequestURISchema,
        getOAuth2AuthorizeCodeChallengeSchema,
        getOAuth2AuthorizeCodeChallengeMethodSchema,
        postOAuth2TokenAuthorizationCodeTokenRequestBodySchema,
        postOAuth2TokenPasswordTokenRequestBodySchema,
        postOAuth2TokenClientCredentialsTokenRequestBodySchema,
        postOAuth2TokenRefreshTokenRequestBodySchema,
        postOAuth2TokenTokenBodySchema,
        postOAuth2TokenCodeVerifierSchema,
        postOAuth2PushedAuthorizationRequestBodySchema,
        postOAuth2PushedAuthorizationRequestRequestURISchema,
      ].reduce(
        (schemasHash, { name, schema }) => ({
          ...schemasHash,
          [name]: schema,
        }),
        {},
      ),
    },
  };
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'oauth'],
    rootClientId: 'the_root_client_id',
  };
  const authentication = {
    check: jest.fn<WhookAuthenticationService<any>['check']>(),
  };
  const oAuth2AuthorizationRequests = {
    check: jest.fn<WhookOAuth2AuthorizationRequestsService['check']>(),
    create: jest.fn<WhookOAuth2AuthorizationRequestsService['create']>(),
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const oAuth2AccessToken = {
    create: jest.fn<WhookOAuth2AccessTokenService['create']>(),
    check: jest.fn<WhookOAuth2AccessTokenService['check']>(),
  };
  const oAuth2RefreshToken = {
    create: jest.fn<WhookOAuth2RefreshTokenService['create']>(),
    check: jest.fn<WhookOAuth2RefreshTokenService['check']>(),
  };
  const oAuth2AuthorizationCode = {
    create: jest.fn<WhookOAuth2AuthorizationCodeService['create']>(),
    check: jest.fn<WhookOAuth2AuthorizationCodeService['check']>(),
  };
  const oAuth2Password = {
    check: jest.fn<WhookOAuth2PasswordService['check']>(),
  };

  let $instance: Knifecycle;

  async function prepareEnvironment() {
    const $ = await basePrepareEnvironment();

    $.register(
      initializer(
        {
          name: '$autoload',
          type: 'service',
          singleton: true,
        },
        async () => $autoload,
      ),
    );
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('API', API));
    $.register(constant('DEFINITIONS', API));
    $.register(constant('APP_ENV', 'local'));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
      }),
    );
    $.register(constant('PORT', PORT));
    $.register(constant('HOST', HOST));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(constant('MECHANISMS', [BEARER_MECHANISM, BASIC_MECHANISM]));
    $.register(constant('logger', logger as Logger));
    $.register(constant('time', time));

    // Auth
    const ROUTES_WRAPPERS_NAMES = ['wrapRouteHandlerWithAuthorization'];

    $.register(initWrapRouteHandlerWithAuthorization);
    $.register(alsoInject(ROUTES_WRAPPERS_NAMES, initRoutesWrappers));
    $.register(constant('ROUTES_WRAPPERS_NAMES', ROUTES_WRAPPERS_NAMES));

    // OAuth2 Specifics
    $.register(constant('OAUTH2', OAUTH2));
    $.register(
      constant('OAUTH2_PAR', {
        mode: 'enabled',
      } satisfies WhookOAuth2AuthorizationRequestsOptions),
    );
    $.register(
      constant('ERRORS_DESCRIPTORS', {
        ...DEFAULT_ERRORS_DESCRIPTORS,
        ...AUTHORIZATION_ERRORS_DESCRIPTORS,
        ...OAUTH2_ERRORS_DESCRIPTORS,
      }),
    );
    $.register(
      alsoInject(
        [
          'getOAuth2Authorize',
          'postOAuth2Acknowledge',
          'postOAuth2Token',
          'postOAuth2PushedAuthorizationRequest',
        ],
        initRoutesHandlers,
      ),
    );
    $.register(constant('authentication', authentication));
    $.register(constant('readClientGrants', readClientGrants));
    $.register(
      constant('oAuth2AuthorizationRequests', oAuth2AuthorizationRequests),
    );
    $.register(constant('oAuth2AccessToken', oAuth2AccessToken));
    $.register(constant('oAuth2RefreshToken', oAuth2RefreshToken));
    $.register(constant('oAuth2AuthorizationCode', oAuth2AuthorizationCode));
    $.register(constant('oAuth2Password', oAuth2Password));
    [
      initGetOAuth2Authorize,
      initPostOAuth2Acknowledge,
      initPostOAuth2Token,
      initOAuth2Granters,
      initOAuth2ClientCredentialsGranter,
      initOAuth2AuthorizationCodeGranter,
      initOAuth2PasswordGranter,
      initOAuth2RefreshTokenGranter,
      initOAuth2ImplicitGranter,
      initPostOAuth2PushedAuthorizationRequest,
    ].forEach((handlerInitializer) => $.register(handlerInitializer as any));

    return $;
  }

  $autoload.mockImplementation(async (serviceName) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', [serviceName as string]);
  });
  process.env.ISOLATED_ENV = '1';

  beforeAll(async () => {
    const { $instance: _instance } = await runProcess<{
      $instance: Knifecycle;
    }>(prepareEnvironment, prepareProcess, [
      '$instance',
      'httpServer',
      'process',
    ]);
    $instance = _instance;
  });

  afterAll(async () => {
    await $instance.destroy();
  });

  beforeEach(() => {
    logger.output.mockReset();
    logger.error.mockReset();
    logger.debug.mockReset();
    time.mockReset();
    $autoload.mockClear();
    [
      oAuth2AccessToken.create,
      oAuth2AccessToken.check,
      oAuth2RefreshToken.create,
      oAuth2RefreshToken.check,
      oAuth2AuthorizationCode.check,
      oAuth2AuthorizationCode.create,
      oAuth2Password.check,
      readClientGrants,
      authentication.check,
      oAuth2AuthorizationRequests.check,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock) => mock.mockReset());
  });

  describe('with the password flow', () => {
    test('should produce new tokens', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2RefreshToken.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code', 'password'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });
      oAuth2Password.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'pwd_user_id',
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'an_access_token',
        expiresAt: Date.parse('2010-03-07T00:00:00Z'),
      });
      oAuth2RefreshToken.create.mockResolvedValueOnce({
        token: 'a_refresh_token',
        expiresAt: Date.parse('2180-03-06T00:00:00Z'),
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2TokenDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          grant_type: 'password',
          username: 'me@example.com',
          password: 'udelawli',
          scope: 'user invalid_scope',
        },
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "pwd_user_id",
             },
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
                 "oauth",
               ],
               "userId": "auth_user_id",
             },
             "me@example.com",
             "udelawli",
           ],
         ],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "pwd_user_id",
             },
           ],
         ],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": {
             "access_token": "an_access_token",
             "expiration_date": "2010-03-07T00:00:00.000Z",
             "expires_in": 86400,
             "refresh_token": "a_refresh_token",
             "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
             "refresh_token_expires_in": 5364748800,
             "scope": "user",
             "token_type": "bearer",
           },
           "headers": {
             "cache-control": "no-store",
             "connection": undefined,
             "content-type": "application/json",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "pragma": "no-cache",
             "server": undefined,
             "transaction-id": "0",
             "transfer-encoding": "chunked",
             "x-authenticated": "{"clientId":"the_client_id","scopes":["user","oauth"],"userId":"auth_user_id"}",
           },
           "status": 200,
         },
       }
      `);
    });

    test('should fail with excluded clients', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2RefreshToken.check,
        oAuth2Password.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2TokenDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          grant_type: 'password',
          username: 'me@example.com',
          password: 'udelawli',
          scope: 'user',
        },
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": {
             "error": "unauthorized_client",
             "error_debug_data": {
               "guruMeditation": "1",
             },
             "error_description": "This grant type is not supported (password).",
             "error_help_uri": "https://stackoverflow.com/questions/ask?tags=whook&title=How+to+debug+E_OAUTH2_GRANT_TYPE_NOT_ALLOWED+whook+error+code",
             "error_uri": "https://stackoverflow.com/search?q=%5Bwhook%5D+E_OAUTH2_GRANT_TYPE_NOT_ALLOWED",
           },
           "headers": {
             "cache-control": "private",
             "connection": undefined,
             "content-type": "text/plain",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "server": undefined,
             "transaction-id": "1",
             "transfer-encoding": "chunked",
           },
           "status": 400,
         },
       }
      `);
    });
  });

  describe('with the refresh token flow', () => {
    test('should produce new tokens', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });
      oAuth2RefreshToken.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'a_user_id',
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'an_access_token',
        expiresAt: Date.parse('2010-03-07T00:00:00Z'),
      });
      oAuth2RefreshToken.create.mockResolvedValueOnce({
        token: 'a_refresh_token',
        expiresAt: Date.parse('2180-03-06T00:00:00Z'),
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2TokenDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          grant_type: 'refresh_token',
          refresh_token: 'a_refresh_token',
          scope: 'user',
        },
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "a_user_id",
             },
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [
           [
             "a_refresh_token",
           ],
         ],
         "oAuth2RefreshTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "a_user_id",
             },
           ],
         ],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": {
             "access_token": "an_access_token",
             "expiration_date": "2010-03-07T00:00:00.000Z",
             "expires_in": 86400,
             "refresh_token": "a_refresh_token",
             "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
             "refresh_token_expires_in": 5364748800,
             "scope": "user",
             "token_type": "bearer",
           },
           "headers": {
             "cache-control": "no-store",
             "connection": undefined,
             "content-type": "application/json",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "pragma": "no-cache",
             "server": undefined,
             "transaction-id": "2",
             "transfer-encoding": "chunked",
             "x-authenticated": "{"clientId":"the_client_id","scopes":["user","oauth"],"userId":"auth_user_id"}",
           },
           "status": 200,
         },
       }
      `);
    });

    test('should fail with excluded apps', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });
      oAuth2RefreshToken.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'refresh_user_id',
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2TokenDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          grant_type: 'refresh_token',
          refresh_token: 'a_refresh_token',
          scope: 'user',
        },
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [
           [
             "a_refresh_token",
           ],
         ],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": {
             "error": "unauthorized_client",
             "error_debug_data": {
               "guruMeditation": "3",
             },
             "error_description": "This grant type is not supported (refresh_token).",
             "error_help_uri": "https://stackoverflow.com/questions/ask?tags=whook&title=How+to+debug+E_OAUTH2_GRANT_TYPE_NOT_ALLOWED+whook+error+code",
             "error_uri": "https://stackoverflow.com/search?q=%5Bwhook%5D+E_OAUTH2_GRANT_TYPE_NOT_ALLOWED",
           },
           "headers": {
             "cache-control": "private",
             "connection": undefined,
             "content-type": "text/plain",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "server": undefined,
             "transaction-id": "3",
             "transfer-encoding": "chunked",
           },
           "status": 400,
         },
       }
      `);
    });

    test('should fail with application id mismatch', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'another_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });
      oAuth2RefreshToken.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'refresh_user_id',
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2TokenDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          grant_type: 'refresh_token',
          refresh_token: 'a_refresh_token',
          scope: 'user',
        },
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [
           [
             "a_refresh_token",
           ],
         ],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [],
         "response": {
           "data": {
             "error": "invalid_request",
             "error_debug_data": {
               "guruMeditation": "4",
             },
             "error_description": "The client used is not matching the request.",
             "error_help_uri": "https://stackoverflow.com/questions/ask?tags=whook&title=How+to+debug+E_OAUTH2_CLIENT_MISMATCH+whook+error+code",
             "error_uri": "https://stackoverflow.com/search?q=%5Bwhook%5D+E_OAUTH2_CLIENT_MISMATCH",
           },
           "headers": {
             "cache-control": "private",
             "connection": undefined,
             "content-type": "text/plain",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "server": undefined,
             "transaction-id": "4",
             "transfer-encoding": "chunked",
           },
           "status": 400,
         },
       }
      `);
    });
  });

  describe('with the client credentials flow', () => {
    test('should produce new tokens', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code', 'client_credentials'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'an_access_token',
        expiresAt: Date.parse('2010-03-07T00:00:00Z'),
      });
      oAuth2RefreshToken.create.mockResolvedValueOnce({
        token: 'a_refresh_token',
        expiresAt: Date.parse('2180-03-06T00:00:00Z'),
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2TokenDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          grant_type: 'client_credentials',
          scope: 'user',
        },
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "auth_user_id",
             },
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": {
             "access_token": "an_access_token",
             "expiration_date": "2010-03-07T00:00:00.000Z",
             "expires_in": 86400,
             "scope": "user",
             "token_type": "bearer",
           },
           "headers": {
             "cache-control": "no-store",
             "connection": undefined,
             "content-type": "application/json",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "pragma": "no-cache",
             "server": undefined,
             "transaction-id": "5",
             "transfer-encoding": "chunked",
             "x-authenticated": "{"clientId":"the_client_id","scopes":["user","oauth"],"userId":"auth_user_id"}",
           },
           "status": 200,
         },
       }
      `);
    });
    test('should fail with excluded apps', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2TokenDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          grant_type: 'client_credentials',
          scope: 'user',
        },
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": {
             "error": "unauthorized_client",
             "error_debug_data": {
               "guruMeditation": "6",
             },
             "error_description": "This grant type is not supported (client_credentials).",
             "error_help_uri": "https://stackoverflow.com/questions/ask?tags=whook&title=How+to+debug+E_OAUTH2_GRANT_TYPE_NOT_ALLOWED+whook+error+code",
             "error_uri": "https://stackoverflow.com/search?q=%5Bwhook%5D+E_OAUTH2_GRANT_TYPE_NOT_ALLOWED",
           },
           "headers": {
             "cache-control": "private",
             "connection": undefined,
             "content-type": "text/plain",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "server": undefined,
             "transaction-id": "6",
             "transfer-encoding": "chunked",
           },
           "status": 400,
         },
       }
      `);
    });
  });

  describe('with the code flow', () => {
    test('should build the authorization redirection', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        authentication.check,
        oAuth2AccessToken.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: [
          'https://redirect.example.com/oauth2/callback?a_param=a_param_value',
        ],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });

      const { status, headers, data } = await axios({
        method: 'get',
        url: `http://${HOST}:${PORT}${BASE_PATH}${getOAuth2AuthorizeDefinition.path}`,
        params: {
          response_type: 'code',
          client_id: 'the_client_id',
          redirect_uri:
            'https://redirect.example.com/oauth2/callback?a_param=a_param_value',
          scope: 'user',
          state: 'xyz',
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": "",
           "headers": {
             "connection": undefined,
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "location": "https://auth.example.com/sign_in?type=code&redirect_uri=https%3A%2F%2Fredirect.example.com%2Foauth2%2Fcallback%3Fa_param%3Da_param_value&scope=user&client_id=the_client_id&state=xyz",
             "server": undefined,
             "transaction-id": "7",
             "transfer-encoding": "chunked",
           },
           "status": 302,
         },
       }
      `);
    });

    test('should redirect with a code', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationCode.check,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_root_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      oAuth2AuthorizationCode.create.mockResolvedValueOnce('a_code');
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['password'],
        allowedScopes: [],
        allowedRedirectURIS: [],
        isPublicClient: false,
        canAcknowledge: true,
        authenticationData: {
          clientId: 'the_root_client_id',
          scopes: [],
          userId: 'a_user_id',
        },
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: [
          'http://redirect.example.com/yolo?a_param=a_value',
        ],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2AcknowledgeDefinition.path}`,
        headers: {
          authorization: 'Bearer yolo',
        },
        data: {
          responseType: 'code',
          clientId: 'the_client_id',
          redirectURI: 'http://redirect.example.com/yolo?a_param=a_value',
          scope: 'user',
          state: 'xyz',
          acknowledged: true,
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "bearer",
             {
               "hash": "yolo",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "auth_user_id",
             },
             {
               "demandedRedirectURI": "http://redirect.example.com/yolo?a_param=a_value",
               "demandedScopes": [
                 "user",
               ],
               "filteredScopes": [
                 "user",
               ],
             },
           ],
         ],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_root_client_id",
           ],
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": "",
           "headers": {
             "connection": undefined,
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "location": "http://redirect.example.com/yolo?a_param=a_value&client_id=the_client_id&scope=user&state=xyz&code=a_code",
             "server": undefined,
             "transaction-id": "8",
             "transfer-encoding": "chunked",
             "x-authenticated": "{"clientId":"the_root_client_id","scopes":["user","oauth"],"userId":"auth_user_id"}",
           },
           "status": 201,
         },
       }
      `);
    });

    test('should produce new tokens', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });
      oAuth2AuthorizationCode.check.mockResolvedValueOnce({
        codeAuthenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
        context: {
          demandedRedirectURI: 'http://redirect.example.com/yolo',
          demandedScopes: ['user'],
          filteredScopes: ['user'],
        },
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'an_access_token',
        expiresAt: Date.parse('2010-03-07T00:00:00Z'),
      });
      oAuth2RefreshToken.create.mockResolvedValueOnce({
        token: 'a_refresh_token',
        expiresAt: Date.parse('2180-03-06T00:00:00Z'),
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2TokenDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          grant_type: 'authorization_code',
          code: 'a_grant_code',
          redirect_uri: 'http://redirect.example.com/yolo',
        },
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "a_user_id",
             },
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
                 "oauth",
               ],
               "userId": "auth_user_id",
             },
             "a_grant_code",
           ],
         ],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "a_user_id",
             },
           ],
         ],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": {
             "access_token": "an_access_token",
             "expiration_date": "2010-03-07T00:00:00.000Z",
             "expires_in": 86400,
             "refresh_token": "a_refresh_token",
             "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
             "refresh_token_expires_in": 5364748800,
             "scope": "user",
             "token_type": "bearer",
           },
           "headers": {
             "cache-control": "no-store",
             "connection": undefined,
             "content-type": "application/json",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "pragma": "no-cache",
             "server": undefined,
             "transaction-id": "9",
             "transfer-encoding": "chunked",
             "x-authenticated": "{"clientId":"the_client_id","scopes":["user","oauth"],"userId":"auth_user_id"}",
           },
           "status": 200,
         },
       }
      `);
    });
  });

  describe('with the implicit flow', () => {
    test('should build the authorization redirection', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        authentication.check,
        oAuth2AccessToken.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['implicit'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });

      const { status, headers, data } = await axios({
        method: 'get',
        url: `http://${HOST}:${PORT}${BASE_PATH}${getOAuth2AuthorizeDefinition.path}`,
        params: {
          response_type: 'token',
          client_id: 'the_client_id',
          redirect_uri: 'http://redirect.example.com/yolo',
          scope: 'user',
          state: 'xyz',
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": "",
           "headers": {
             "connection": undefined,
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "location": "https://auth.example.com/sign_in?type=token&redirect_uri=http%3A%2F%2Fredirect.example.com%2Fyolo&scope=user&client_id=the_client_id&state=xyz",
             "server": undefined,
             "transaction-id": "10",
             "transfer-encoding": "chunked",
           },
           "status": 302,
         },
       }
      `);
    });

    test('should redirect with a token', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_root_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'an_access_token',
        expiresAt: Date.parse('2010-03-07T00:00:00Z'),
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['password'],
        allowedScopes: [],
        allowedRedirectURIS: [],
        isPublicClient: false,
        canAcknowledge: true,
        authenticationData: {
          clientId: 'the_root_client_id',
          scopes: [],
          userId: 'a_user_id',
        },
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['implicit'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: [
          'http://redirect.example.com/yolo?a_param=a_value',
        ],
        isPublicClient: true,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2AcknowledgeDefinition.path}`,
        headers: {
          authorization: 'Bearer yolo',
        },
        data: {
          responseType: 'token',
          clientId: 'the_client_id',
          redirectURI: 'http://redirect.example.com/yolo?a_param=a_value',
          scope: 'user',
          state: 'xyz',
          acknowledged: true,
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "bearer",
             {
               "hash": "yolo",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "auth_user_id",
             },
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_root_client_id",
           ],
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": "",
           "headers": {
             "connection": undefined,
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "location": "http://redirect.example.com/yolo?a_param=a_value#client_id=the_client_id&scope=user&state=xyz&access_token=an_access_token&token_type=bearer&expires_in=86400",
             "server": undefined,
             "transaction-id": "11",
             "transfer-encoding": "chunked",
             "x-authenticated": "{"clientId":"the_root_client_id","scopes":["user","oauth"],"userId":"auth_user_id"}",
           },
           "status": 201,
         },
       }
      `);
    });
  });

  describe('with PAR flow', () => {
    test('should prepare the authorization redirection', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['implicit'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });
      oAuth2AuthorizationRequests.create.mockResolvedValueOnce({
        requestURI: 'urn:ietf:params:oauth:request_uri:a_request_uri',
        expiresIn: 95000,
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2PushedAuthorizationRequestDefinition.path}`,
        headers: {
          authorization: `basic ${Buffer.from('ali:open_sesame').toString(
            'base64',
          )}`,
        },
        data: {
          response_type: 'token',
          client_id: 'the_client_id',
          redirect_uri: 'http://redirect.example.com/yolo',
          scope: 'user',
          state: 'xyz',
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "basic",
             {
               "hash": "YWxpOm9wZW5fc2VzYW1l",
               "password": "open_sesame",
               "username": "ali",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": {
             "expires_in": 95,
             "request_uri": "urn:ietf:params:oauth:request_uri:a_request_uri",
           },
           "headers": {
             "cache-control": "no-store",
             "connection": undefined,
             "content-type": "application/json",
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "pragma": "no-cache",
             "server": undefined,
             "transaction-id": "12",
             "transfer-encoding": "chunked",
             "x-authenticated": "{"clientId":"the_client_id","scopes":["user","oauth"],"userId":"auth_user_id"}",
           },
           "status": 201,
         },
       }
      `);
    });

    test('should build the authorization redirection', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        authentication.check,
        oAuth2AccessToken.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['implicit'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: ['http://redirect.example.com/yolo'],
        isPublicClient: false,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });
      oAuth2AuthorizationRequests.check.mockResolvedValueOnce({
        clientId: 'the_client_id',
        parameters: {
          response_type: 'token',
          client_id: 'the_client_id',
          redirect_uri: 'http://redirect.example.com/yolo',
          scope: 'user',
          state: 'xyz',
        },
        expiresAt: Date.parse('2010-03-07T00:00:00Z'),
      });

      const { status, headers, data } = await axios({
        method: 'get',
        url: `http://${HOST}:${PORT}${BASE_PATH}${getOAuth2AuthorizeDefinition.path}`,
        params: {
          client_id: 'the_client_id',
          request_uri: 'urn:ietf:params:oauth:request_uri:a_request_uri',
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": "",
           "headers": {
             "connection": undefined,
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "location": "https://auth.example.com/sign_in?type=token&redirect_uri=http%3A%2F%2Fredirect.example.com%2Fyolo&scope=user&client_id=the_client_id&state=xyz",
             "server": undefined,
             "transaction-id": "13",
             "transfer-encoding": "chunked",
           },
           "status": 302,
         },
       }
      `);
    });

    test('should redirect with a token', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2AuthorizationCode.check,
        oAuth2AuthorizationCode.create,
        oAuth2Password.check,
        oAuth2AuthorizationRequests.check,
        oAuth2AuthorizationRequests.create,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        clientId: 'the_root_client_id',
        scopes: ['user', 'oauth'],
        userId: 'auth_user_id',
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'an_access_token',
        expiresAt: Date.parse('2010-03-07T00:00:00Z'),
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['password'],
        allowedScopes: [],
        allowedRedirectURIS: [],
        isPublicClient: false,
        canAcknowledge: true,
        authenticationData: {
          clientId: 'the_root_client_id',
          scopes: [],
          userId: 'a_user_id',
        },
      });
      readClientGrants.mockResolvedValueOnce({
        allowedGrantTypes: ['implicit'],
        allowedScopes: ['user', 'oauth'],
        allowedRedirectURIS: [
          'http://redirect.example.com/yolo?a_param=a_value',
        ],
        isPublicClient: true,
        authenticationData: {
          clientId: 'the_client_id',
          scopes: ['user', 'oauth'],
          userId: 'a_user_id',
        },
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2AcknowledgeDefinition.path}`,
        headers: {
          authorization: 'Bearer yolo',
        },
        data: {
          responseType: 'token',
          clientId: 'the_client_id',
          redirectURI: 'http://redirect.example.com/yolo?a_param=a_value',
          scope: 'user',
          state: 'xyz',
          acknowledged: true,
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
        response: {
          status,
          headers: {
            ...headers,
            // Erasing the Date header that may be added by Axios :/
            date: undefined,
            etag: undefined,
            'last-modified': undefined,
            server: undefined,
            connection: undefined,
            'keep-alive': undefined,
          },
          data,
        },
        readClientGrantsCalls: readClientGrants.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticationCheckCalls": [
           [
             "bearer",
             {
               "hash": "yolo",
             },
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [
           [
             {
               "clientId": "the_client_id",
               "scopes": [
                 "user",
               ],
               "userId": "auth_user_id",
             },
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "oAuth2PasswordCheckCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_root_client_id",
           ],
           [
             "the_client_id",
           ],
         ],
         "response": {
           "data": "",
           "headers": {
             "connection": undefined,
             "date": undefined,
             "etag": undefined,
             "keep-alive": undefined,
             "last-modified": undefined,
             "location": "http://redirect.example.com/yolo?a_param=a_value#client_id=the_client_id&scope=user&state=xyz&access_token=an_access_token&token_type=bearer&expires_in=86400",
             "server": undefined,
             "transaction-id": "14",
             "transfer-encoding": "chunked",
             "x-authenticated": "{"clientId":"the_root_client_id","scopes":["user","oauth"],"userId":"auth_user_id"}",
           },
           "status": 201,
         },
       }
      `);
    });
  });
});
