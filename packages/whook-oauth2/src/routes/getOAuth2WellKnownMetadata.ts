import {
  identity,
  refersTo,
  type WhookRoutesDefinitionsService,
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
} from '@whook/whook';
import { autoService, location } from 'knifecycle';
import { type OAuth2GranterService } from '../services/oAuth2Granters.js';
import { codeChallengeMethodSchema } from './getOAuth2Authorize.js';
import { type LogService } from 'common-services';
import { type OpenAPI } from 'ya-open-api-types';
import { collectScopesFromAPI } from '../libs/scopes.js';

// OAuth Token Endpoint Authentication Methods
export const endpointAuthenticationMethodsSchema = {
  name: 'OAuthTokenEndpointAuthenticationMethods',
  schema: {
    type: 'string',
    enum: [
      'none',
      'client_secret_post',
      'client_secret_basic',
      'client_secret_jwt',
      'private_key_jwt',
      'tls_client_auth',
      'self_signed_tls_client_auth',
    ],
  },
} as const satisfies WhookAPISchemaDefinition;

// JSON Web Algorithms (JWA) except "none"
// https://www.iana.org/assignments/jose/jose.xhtml#web-signature-encryption-algorithms
export const jsonWebAlgorithmsSchema = {
  name: 'JSONWebAlgorithms',
  schema: {
    type: 'string',
    enum: [
      'HS256',
      'HS384',
      'HS512',
      'RS256',
      'RS384',
      'RS512',
      'ES256',
      'ES384',
      'ES512',
      'PS256',
      'PS384',
      'PS512',
    ],
  },
} as const satisfies WhookAPISchemaDefinition;

// JSON Web Encryptions (JWE)
// https://www.iana.org/assignments/jose/jose.xhtml#web-signature-encryption-algorithms
export const jsonWebEncryptionsSchema = {
  name: 'JSONWebEncryptions',
  schema: {
    type: 'string',
    enum: [
      'A128CBC-HS256',
      'A192CBC-HS384',
      'A256CBC-HS512',
      'A128GCM',
      'A192GCM',
      'A256GCM',
    ],
  },
} as const satisfies WhookAPISchemaDefinition;

export const httpsProtocolURISchema = {
  name: 'HTTPSProtocolURI',
  schema: {
    type: 'string',
    format: 'uri',
    pattern: '^https:',
  },
} as const satisfies WhookAPISchemaDefinition;

export const oAuth2MetadataSchema = {
  name: 'OAuth2MetadataSchema',
  schema: {
    type: 'object',
    required: ['issuer', 'response_types_supported'],
    properties: {
      issuer: refersTo(httpsProtocolURISchema),
      authorization_endpoint: refersTo(httpsProtocolURISchema),
      token_endpoint: refersTo(httpsProtocolURISchema),
      jwks_uri: refersTo(httpsProtocolURISchema),
      registration_endpoint: refersTo(httpsProtocolURISchema),
      scopes_supported: { type: 'array', items: { type: 'string' } },
      response_types_supported: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'code',
            'code id_token',
            'code id_token token',
            'code token',
            'id_token',
            'id_token token',
            'none',
            'token',
            'vp_token',
            'vp_token id_token',
          ],
        },
      },
      response_modes_supported: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['query', 'fragment', 'form_post'],
        },
      },
      grant_types_supported: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'authorization_code',
            'implicit',
            'refresh_token',
            'client_credentials',
            'password',
            'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'urn:ietf:params:oauth:grant-type:saml2-bearer',
          ],
        },
      },
      token_endpoint_auth_methods_supported: {
        type: 'array',
        items: refersTo(endpointAuthenticationMethodsSchema),
      },
      service_documentation: refersTo(httpsProtocolURISchema),
      token_endpoint_auth_signing_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      ui_locales_supported: { type: 'array', items: { type: 'string' } },
      op_policy_uri: refersTo(httpsProtocolURISchema),
      op_tos_uri: refersTo(httpsProtocolURISchema),
      revocation_endpoint: refersTo(httpsProtocolURISchema),
      revocation_endpoint_auth_methods_supported: {
        type: 'array',
        items: refersTo(endpointAuthenticationMethodsSchema),
      },
      revocation_endpoint_auth_signing_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      introspection_endpoint: refersTo(httpsProtocolURISchema),
      introspection_endpoint_auth_methods_supported: {
        type: 'array',
        items: refersTo(endpointAuthenticationMethodsSchema),
      },
      introspection_endpoint_auth_signing_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      code_challenge_methods_supported: {
        type: 'array',
        items: refersTo(codeChallengeMethodSchema),
      },
      // OpenID specs: https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
      userinfo_endpoint: refersTo(httpsProtocolURISchema),
      acr_values_supported: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      subject_types_supported: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['pairwise', 'public'],
        },
      },
      id_token_signing_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      id_token_encryption_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      id_token_encryption_enc_values_supported: {
        type: 'array',
        items: refersTo(jsonWebEncryptionsSchema),
      },
      userinfo_signing_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      userinfo_encryption_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      userinfo_encryption_enc_values_supported: {
        type: 'array',
        items: refersTo(jsonWebEncryptionsSchema),
      },
      request_object_signing_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      request_object_encryption_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      request_object_encryption_enc_values_supported: {
        type: 'array',
        items: refersTo(jsonWebEncryptionsSchema),
      },
      display_values_supported: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      claim_types_supported: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['normal', 'aggregated', 'distributed'],
        },
      },
      claims_supported: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      claims_locales_supported: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      claims_parameter_supported: {
        type: 'boolean',
      },
      request_parameter_supported: {
        type: 'boolean',
      },
      request_uri_parameter_supported: {
        type: 'boolean',
      },
      require_request_uri_registration: {
        type: 'boolean',
      },
      // https://openid.net/specs/openid-connect-session-1_0.html#OPMetadata
      check_session_iframe: {
        type: 'string',
        format: 'uri',
      },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const definition = {
  method: 'get',
  path: '/.well-known/oauth-authorization-server',
  config: {
    global: true,
  },
  operation: {
    operationId: 'getOAuth2WellKnownMetadata',
    summary: `Provide the [OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414).`,
    tags: ['oauth2'],
    parameters: [],
    responses: {
      '200': {
        description: 'Well known OAuth2 specs found.',
        content: {
          'application/json': {
            schema: refersTo(oAuth2MetadataSchema),
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initGetOAuth2WellKnownMetadata({
  API,
  BASE_URL,
  ROUTES_DEFINITIONS,
  oAuth2Granters,
  log,
}: {
  API: OpenAPI;
  BASE_URL: string;
  ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  oAuth2Granters: OAuth2GranterService[];
  log: LogService;
}) {
  if (!BASE_URL.startsWith('https')) {
    log('warning', `⚠️ - OAuth2 issuer must start with HTTPS (${BASE_URL}).`);
  }

  const body = {
    issuer: `${BASE_URL}`,
    authorization_endpoint: `${BASE_URL}${ROUTES_DEFINITIONS['getOAuth2Authorize']?.module.definition.path || '/oauth2/authorize'}`,
    token_endpoint: `${BASE_URL}${ROUTES_DEFINITIONS['postOAuth2Token']?.module.definition.path || '/oauth2/token'}`,
    // TODO: Put it behind options (allow none)
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
    ],
    grant_types_supported: [
      ...new Set(
        oAuth2Granters
          .map((granter) => granter.authenticator?.grantType)
          .filter(identity),
      ),
    ],
    response_types_supported: [
      ...new Set(
        oAuth2Granters
          .map((granter) => granter.authorizer?.responseType)
          .filter(identity),
      ),
    ],
    scopes_supported: collectScopesFromAPI(API),
  };

  return async () => {
    return {
      status: 200,
      body,
    };
  };
}

export default location(
  autoService(initGetOAuth2WellKnownMetadata),
  import.meta.url,
);
