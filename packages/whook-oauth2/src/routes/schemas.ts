import { refersTo, type WhookAPISchemaDefinition } from '@whook/whook';

export const clientIdSchema = {
  name: 'clientId',
  schema: {
    type: 'string',
    minLength: 1,
  },
} as const satisfies WhookAPISchemaDefinition;

export const scopeTokenSchema = {
  name: 'ScopeToken',
  schema: {
    description:
      'OAuth 2.1 scope token, see https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-15.html#name-access-token-scope',
    type: 'string',
    pattern: '^[!#-[\\]-~]+$',
  },
} as const satisfies WhookAPISchemaDefinition;
export const scopeTokensSchema = {
  name: 'ScopeTokens',
  schema: {
    type: 'array',
    items: refersTo(scopeTokenSchema),
  },
} as const satisfies WhookAPISchemaDefinition;
export const scopeSchema = {
  name: 'Scope',
  schema: {
    description:
      'OAuth 2.1 scope, see https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-15.html#name-access-token-scope',
    type: 'string',
    pattern: '^[!#-[\\]-~]+(?: [!#-[\\]-~]+)*$',
  },
} as const satisfies WhookAPISchemaDefinition;

export const requestURISchema = {
  name: 'RequestURI',
  schema: {
    description:
      'OAuth2 PAR request_uri, see https://datatracker.ietf.org/doc/html/rfc9126#section-2.2.',
    type: 'string',
    pattern: '^urn:ietf:params:oauth:request_uri:',
  },
} as const satisfies WhookAPISchemaDefinition;

export const codeVerifierSchema = {
  name: 'CodeVerifier',
  schema: {
    type: 'string',
    minLength: 43,
    maxLength: 128,
    pattern: '^[A-Za-z0-9._~-]+$',
  },
} as const satisfies WhookAPISchemaDefinition;

export const authorizationCodeSchema = {
  name: 'AuthorizationCode',
  schema: {
    type: 'string',
    minLength: 1,
  },
} as WhookAPISchemaDefinition;

export const codeChallengeSchema = {
  name: 'CodeChallenge',
  schema: {
    type: 'string',
    minLength: 43,
    maxLength: 128,
    pattern: '^[A-Za-z0-9\\-._~]{43,128}$',
  },
} as const satisfies WhookAPISchemaDefinition;

export const authorizationCodeTokenRequestBodySchema = {
  name: 'AuthorizationCodeRequestBody',
  schema: {
    description:
      'Implements the [Token Endpoint](https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-15.html#section-3.2) as defined per the OAuth2.1 RFC.',
    type: 'object',
    required: ['grant_type', 'code'],
    properties: {
      grant_type: {
        type: 'string',
        const: 'authorization_code',
      },
      code: refersTo(authorizationCodeSchema),
      client_id: refersTo(clientIdSchema),
      redirect_uri: {
        type: 'string',
        pattern: '^https?://',
        format: 'uri',
      },
      code_verifier: refersTo(codeVerifierSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const plainCodeChallengeMethodSchema = {
  name: 'PlainCodeChallengeMethod',
  schema: {
    type: 'string',
    const: 'plain',
  },
} as const satisfies WhookAPISchemaDefinition;

export const s256CodeChallengeMethodSchema = {
  name: 'S256CodeChallengeMethod',
  schema: {
    type: 'string',
    const: 'S256',
  },
} as const satisfies WhookAPISchemaDefinition;

export const codeChallengeMethodSchema = {
  name: 'CodeChallengeMethod',
  schema: {
    type: 'string',
    oneOf: [
      refersTo(plainCodeChallengeMethodSchema),
      refersTo(s256CodeChallengeMethodSchema),
    ],
  },
} as const satisfies WhookAPISchemaDefinition;

export const refreshTokenRequestBodySchema = {
  name: 'RefreshTokenRequestBody',
  schema: {
    type: 'object',
    description:
      'Token refresh grant type, see https://tools.ietf.org/html/rfc6749#section-6 .',
    required: ['grant_type', 'refresh_token'],
    properties: {
      grant_type: {
        type: 'string',
        const: 'refresh_token',
      },
      refresh_token: {
        type: 'string',
      },
      scope: refersTo(scopeSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const deviceCodeSchema = {
  name: 'OAuth2DeviceCode',
  schema: {
    type: 'string',
    minLength: 1,
  },
} as const satisfies WhookAPISchemaDefinition;

export const deviceAuthorizationTokenRequestBodySchema = {
  name: 'DeviceAuthorizationTokenRequestBody',
  schema: {
    type: 'object',
    description:
      'Device authorization grant poll request, see https://datatracker.ietf.org/doc/html/rfc8628#section-3.4',
    required: ['grant_type', 'device_code'],
    properties: {
      grant_type: {
        type: 'string',
        const: 'urn:ietf:params:oauth:grant-type:device_code',
      },
      device_code: refersTo(deviceCodeSchema),
      client_id: refersTo(clientIdSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const passwordTokenRequestBodySchema = {
  name: 'PasswordRequestBody',
  schema: {
    type: 'object',
    description:
      'Resource owner password credentials grant, see https://tools.ietf.org/html/rfc6749#section-4.3',
    required: ['grant_type', 'username', 'password'],
    properties: {
      grant_type: {
        type: 'string',
        const: 'password',
      },
      username: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
      scope: refersTo(scopeSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const clientCredentialsTokenRequestBodySchema = {
  name: 'ClientCredentialsRequestBody',
  schema: {
    type: 'object',
    description:
      'Client credentials grant, see https://tools.ietf.org/html/rfc6749#section-4.4',
    required: ['grant_type'],
    properties: {
      grant_type: {
        type: 'string',
        const: 'client_credentials',
      },
      scope: refersTo(scopeSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;
