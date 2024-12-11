/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  it,
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
  initWrappers,
  initHandlers,
} from '@whook/whook';
import {
  AUTHORIZATION_ERRORS_DESCRIPTORS,
  initWrapHandlerWithAuthorization,
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
  initPostOAuth2Acknowledge,
  postOAuth2AcknowledgeDefinition,
  initPostOAuth2Token,
  postOAuth2TokenDefinition,
  OAUTH2_ERRORS_DESCRIPTORS,
  initOAuth2CodeGranter,
  initOAuth2PasswordGranter,
  initOAuth2RefreshTokenGranter,
  initOAuth2Granters,
  initOAuth2ClientCredentialsGranter,
  initOAuth2TokenGranter,
  postOAuth2TokenAuthorizationCodeTokenRequestBodySchema,
  postOAuth2TokenPasswordTokenRequestBodySchema,
  postOAuth2TokenClientCredentialsTokenRequestBodySchema,
  postOAuth2TokenTokenBodySchema,
  postOAuth2TokenRefreshTokenRequestBodySchema,
  type OAuth2Options,
  type CheckApplicationService,
  type OAuth2PasswordService,
  type OAuth2CodeService,
  type OAuth2RefreshTokenService,
  type OAuth2AccessTokenService,
} from './index.js';
import { type Knifecycle } from 'knifecycle';
import { type OpenAPIV3_1 } from 'openapi-types';
import { type Logger } from 'common-services';
import {
  type AuthenticationService,
  type BaseAuthenticationData,
} from '@whook/authorization';

type CustomAuthenticationData = BaseAuthenticationData & {
  userId: string;
};

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

  const API: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [getOAuth2AuthorizeDefinition.path]: {
        [getOAuth2AuthorizeDefinition.method]:
          getOAuth2AuthorizeDefinition.operation,
      },
      [postOAuth2AcknowledgeDefinition.path]: {
        [postOAuth2AcknowledgeDefinition.method]: {
          ...postOAuth2AcknowledgeDefinition.operation,
          security: [
            {
              bearerAuth: ['user'],
            },
          ],
        },
      },
      [postOAuth2TokenDefinition.path]: {
        [postOAuth2TokenDefinition.method]: {
          ...postOAuth2TokenDefinition.operation,
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
      ].reduce(
        (parametersHash, { name, parameter }) => ({
          ...parametersHash,
          [name]: parameter,
        }),
        {},
      ),
      schemas: [
        postOAuth2TokenAuthorizationCodeTokenRequestBodySchema,
        postOAuth2TokenPasswordTokenRequestBodySchema,
        postOAuth2TokenClientCredentialsTokenRequestBodySchema,
        postOAuth2TokenRefreshTokenRequestBodySchema,
        postOAuth2TokenTokenBodySchema,
      ].reduce(
        (schemasHash, { name, schema }) => ({
          ...schemasHash,
          [name]: schema,
        }),
        {},
      ),
    },
  };
  const OAUTH2: OAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
  };
  const authentication = {
    check:
      jest.fn<AuthenticationService<any, CustomAuthenticationData>['check']>(),
  };
  const checkApplication = jest.fn<CheckApplicationService>();
  const oAuth2AccessToken = {
    create:
      jest.fn<OAuth2AccessTokenService<CustomAuthenticationData>['create']>(),
    check:
      jest.fn<OAuth2AccessTokenService<CustomAuthenticationData>['check']>(),
  };
  const oAuth2RefreshToken = {
    create:
      jest.fn<OAuth2RefreshTokenService<CustomAuthenticationData>['create']>(),
    check:
      jest.fn<OAuth2RefreshTokenService<CustomAuthenticationData>['check']>(),
  };
  const oAuth2Code = {
    create: jest.fn<OAuth2CodeService<CustomAuthenticationData>['create']>(),
    check: jest.fn<OAuth2CodeService<CustomAuthenticationData>['check']>(),
  };
  const oAuth2Password = {
    check: jest.fn<OAuth2PasswordService<CustomAuthenticationData>['check']>(),
  };

  let $instance;

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
    const HANDLERS_WRAPPERS = ['wrapHandlerWithAuthorization'];

    $.register(initWrapHandlerWithAuthorization);
    $.register(alsoInject(HANDLERS_WRAPPERS, initWrappers));
    $.register(constant('HANDLERS_WRAPPERS', HANDLERS_WRAPPERS));

    // OAuth2 Specifics
    $.register(constant('OAUTH2', OAUTH2));
    $.register(
      constant('ERRORS_DESCRIPTORS', {
        ...DEFAULT_ERRORS_DESCRIPTORS,
        ...AUTHORIZATION_ERRORS_DESCRIPTORS,
        ...OAUTH2_ERRORS_DESCRIPTORS,
      }),
    );
    $.register(
      alsoInject(
        ['getOAuth2Authorize', 'postOAuth2Acknowledge', 'postOAuth2Token'],
        initHandlers,
      ),
    );
    $.register(constant('authentication', authentication));
    $.register(constant('checkApplication', checkApplication));
    $.register(constant('oAuth2AccessToken', oAuth2AccessToken));
    $.register(constant('oAuth2RefreshToken', oAuth2RefreshToken));
    $.register(constant('oAuth2Code', oAuth2Code));
    $.register(constant('oAuth2Password', oAuth2Password));
    [
      initGetOAuth2Authorize,
      initPostOAuth2Acknowledge,
      initPostOAuth2Token,
      initOAuth2Granters,
      initOAuth2ClientCredentialsGranter,
      initOAuth2CodeGranter,
      initOAuth2PasswordGranter,
      initOAuth2RefreshTokenGranter,
      initOAuth2TokenGranter,
    ].forEach((handlerInitializer) => $.register(handlerInitializer as any));

    return $;
  }

  $autoload.mockImplementation(async (serviceName) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', serviceName);
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
      oAuth2Code.check,
      oAuth2Code.create,
      oAuth2Password.check,
      checkApplication,
      authentication.check,
    ].forEach((mock) => mock.mockReset());
  });

  describe('with the password flow', () => {
    it('should produce new tokens', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2Code.check,
        oAuth2Code.create,
        oAuth2RefreshToken.check,
      ].forEach((mock: any) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        userId: '2',
      });
      checkApplication.mockResolvedValueOnce({
        type: 'code',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI: 'http://redirect.example.com/yolo',
      });
      oAuth2Password.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,auth',
        userId: '1',
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
          scope: 'user',
        },
        validateStatus: () => true,
      });

      expect({
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
      }).toMatchInlineSnapshot(`
{
  "data": {
    "access_token": "an_access_token",
    "expiration_date": "2010-03-07T00:00:00.000Z",
    "expires_in": 86400,
    "refresh_token": "a_refresh_token",
    "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
    "refresh_token_expires_in": 5364748800,
    "token_type": "bearer",
  },
  "headers": {
    "connection": undefined,
    "content-type": "application/json",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transaction-id": "0",
    "transfer-encoding": "chunked",
    "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth","userId":"2"}",
  },
  "status": 200,
}
`);
      expect({
        checkApplicationCalls: checkApplication.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
        oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchSnapshot();
    });
  });

  describe('with the refresh token flow', () => {
    it('should produce new tokens', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2Code.check,
        oAuth2Code.create,
        oAuth2Password.check,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        userId: '2',
      });
      checkApplication.mockResolvedValueOnce({
        type: 'code',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI: 'http://redirect.example.com/yolo',
      });
      oAuth2RefreshToken.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,auth',
        userId: '1',
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
      }).toMatchInlineSnapshot(`
{
  "data": {
    "access_token": "an_access_token",
    "expiration_date": "2010-03-07T00:00:00.000Z",
    "expires_in": 86400,
    "refresh_token": "a_refresh_token",
    "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
    "refresh_token_expires_in": 5364748800,
    "token_type": "bearer",
  },
  "headers": {
    "connection": undefined,
    "content-type": "application/json",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transaction-id": "1",
    "transfer-encoding": "chunked",
    "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth","userId":"2"}",
  },
  "status": 200,
}
`);
      expect({
        checkApplicationCalls: checkApplication.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
        oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchSnapshot();
    });
  });

  describe('with the client credentials flow', () => {
    it('should produce new tokens', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2Code.check,
        oAuth2Code.create,
        oAuth2Password.check,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        userId: '2',
      });
      checkApplication.mockResolvedValueOnce({
        type: 'code',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI: 'http://redirect.example.com/yolo',
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
      }).toMatchInlineSnapshot(`
{
  "data": {
    "access_token": "an_access_token",
    "expiration_date": "2010-03-07T00:00:00.000Z",
    "expires_in": 86400,
    "refresh_token": "a_refresh_token",
    "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
    "refresh_token_expires_in": 5364748800,
    "token_type": "bearer",
  },
  "headers": {
    "connection": undefined,
    "content-type": "application/json",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transaction-id": "2",
    "transfer-encoding": "chunked",
    "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth","userId":"2"}",
  },
  "status": 200,
}
`);
      expect({
        checkApplicationCalls: checkApplication.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
        oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchSnapshot();
    });
  });

  describe('with the code flow', () => {
    it('should build the authorization redirection', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        authentication.check,
        oAuth2AccessToken.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2Code.check,
        oAuth2Code.create,
        oAuth2Password.check,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      checkApplication.mockResolvedValueOnce({
        type: 'code',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI:
          'https://example.com/oauth2/callback?a_param=a_param_value',
      });

      const { status, headers, data } = await axios({
        method: 'get',
        url: `http://${HOST}:${PORT}${BASE_PATH}${getOAuth2AuthorizeDefinition.path}`,
        params: {
          response_type: 'code',
          client_id: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
          redirect_uri:
            'https://example.com/oauth2/callback?a_param=a_param_value',
          scope: 'user',
          state: 'xyz',
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
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
      }).toMatchInlineSnapshot(`
{
  "data": "",
  "headers": {
    "connection": undefined,
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "location": "https://auth.example.com/sign_in?type=code&redirect_uri=https%3A%2F%2Fexample.com%2Foauth2%2Fcallback%3Fa_param%3Da_param_value&scope=user&client_id=acdc41ce-acdc-41ce-acdc-41ceacdc41ce&state=xyz",
    "server": undefined,
    "transaction-id": "3",
    "transfer-encoding": "chunked",
  },
  "status": 302,
}
`);
      expect({
        checkApplicationCalls: checkApplication.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
        oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchSnapshot();
    });

    it('should redirect with a code', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2Code.check,
        oAuth2Password.check,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        userId: '2',
      });
      oAuth2Code.create.mockResolvedValueOnce('a_code');
      checkApplication.mockResolvedValueOnce({
        type: 'code',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI: 'http://redirect.example.com/yolo',
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2AcknowledgeDefinition.path}`,
        headers: {
          authorization: 'Bearer yolo',
        },
        data: {
          responseType: 'code',
          clientId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
          redirectURI: 'http://redirect.example.com/yolo?a_param=a_value',
          scope: 'user',
          state: 'xyz',
          acknowledged: true,
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
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
      }).toMatchInlineSnapshot(`
{
  "data": "",
  "headers": {
    "connection": undefined,
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "location": "http://redirect.example.com/yolo?a_param=a_value&client_id=acdc41ce-acdc-41ce-acdc-41ceacdc41ce&scope=user&state=xyz&redirect_uri=http%3A%2F%2Fredirect.example.com%2Fyolo%3Fa_param%3Da_value&code=a_code",
    "server": undefined,
    "transaction-id": "4",
    "transfer-encoding": "chunked",
    "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth","userId":"2"}",
  },
  "status": 302,
}
`);
      expect({
        checkApplicationCalls: checkApplication.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
        oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchSnapshot();
    });

    it('should produce new tokens', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2Password.check,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        userId: '2',
      });
      checkApplication.mockResolvedValueOnce({
        type: 'code',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI: 'http://redirect.example.com/yolo',
      });
      oAuth2Code.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,auth',
        userId: '1',
        redirectURI: 'http://redirect.example.com/yolo',
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
      }).toMatchInlineSnapshot(`
{
  "data": {
    "access_token": "an_access_token",
    "expiration_date": "2010-03-07T00:00:00.000Z",
    "expires_in": 86400,
    "refresh_token": "a_refresh_token",
    "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
    "refresh_token_expires_in": 5364748800,
    "token_type": "bearer",
  },
  "headers": {
    "connection": undefined,
    "content-type": "application/json",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transaction-id": "5",
    "transfer-encoding": "chunked",
    "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth","userId":"2"}",
  },
  "status": 200,
}
`);
      expect({
        checkApplicationCalls: checkApplication.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
        oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchSnapshot();
    });
  });

  describe('with the implicit flow', () => {
    it('should build the authorization redirection', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        authentication.check,
        oAuth2AccessToken.check,
        oAuth2AccessToken.create,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2Code.check,
        oAuth2Code.create,
        oAuth2Password.check,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      checkApplication.mockResolvedValueOnce({
        type: 'implicit',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI: 'http://redirect.example.com/yolo',
      });

      const { status, headers, data } = await axios({
        method: 'get',
        url: `http://${HOST}:${PORT}${BASE_PATH}${getOAuth2AuthorizeDefinition.path}`,
        params: {
          response_type: 'token',
          client_id: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
          redirect_uri: 'http://redirect.example.com/yolo',
          scope: 'user',
          state: 'xyz',
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
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
      }).toMatchInlineSnapshot(`
{
  "data": "",
  "headers": {
    "connection": undefined,
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "location": "https://auth.example.com/sign_in?type=token&redirect_uri=http%3A%2F%2Fredirect.example.com%2Fyolo&scope=user&client_id=acdc41ce-acdc-41ce-acdc-41ceacdc41ce&state=xyz",
    "server": undefined,
    "transaction-id": "6",
    "transfer-encoding": "chunked",
  },
  "status": 302,
}
`);
      expect({
        checkApplicationCalls: checkApplication.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
        oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchSnapshot();
    });

    it('should redirect with a token', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      [
        oAuth2AccessToken.check,
        oAuth2RefreshToken.check,
        oAuth2RefreshToken.create,
        oAuth2Code.check,
        oAuth2Code.create,
        oAuth2Password.check,
      ].forEach((mock) =>
        mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
      );
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        userId: '2',
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'an_access_token',
        expiresAt: Date.parse('2010-03-07T00:00:00Z'),
      });
      checkApplication.mockResolvedValueOnce({
        type: 'implicit',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI: 'http://redirect.example.com/yolo',
      });
      checkApplication.mockResolvedValueOnce({
        type: 'implicit',
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
        redirectURI: 'http://redirect.example.com/yolo',
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postOAuth2AcknowledgeDefinition.path}`,
        headers: {
          authorization: 'Bearer yolo',
        },
        data: {
          responseType: 'token',
          clientId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
          redirectURI: 'http://redirect.example.com/yolo?a_param=a_value',
          scope: 'user',
          state: 'xyz',
          acknowledged: true,
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      expect({
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
      }).toMatchInlineSnapshot(`
{
  "data": "",
  "headers": {
    "connection": undefined,
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "location": "http://redirect.example.com/yolo?a_param=a_value&client_id=acdc41ce-acdc-41ce-acdc-41ceacdc41ce&scope=user&state=xyz&redirect_uri=http%3A%2F%2Fredirect.example.com%2Fyolo&access_token=an_access_token&token_type=bearer&expires_in=86400",
    "server": undefined,
    "transaction-id": "7",
    "transfer-encoding": "chunked",
    "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth","userId":"2"}",
  },
  "status": 302,
}
`);
      expect({
        checkApplicationCalls: checkApplication.mock.calls,
        authenticationCheckCalls: authentication.check.mock.calls,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        oAuth2CodeCheckCalls: oAuth2Code.check.mock.calls,
        oAuth2CodeCreateCalls: oAuth2Code.create.mock.calls,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      }).toMatchSnapshot();
    });
  });
});
