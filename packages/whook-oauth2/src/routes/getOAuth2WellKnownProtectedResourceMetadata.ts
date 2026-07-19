import {
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
  refersTo,
} from '@whook/whook';
import { autoService, location } from 'knifecycle';
import {
  httpsProtocolURISchema,
  jsonWebAlgorithmsSchema,
} from './getOAuth2WellKnownMetadata.js';
import { type LogService } from 'common-services';
import { type OpenAPI } from 'ya-open-api-types';
import { collectScopesFromAPI } from '../libs/scopes.js';

export const bearerMethodSchema = {
  name: 'OAuth2BearerMethod',
  schema: {
    type: 'string',
    enum: ['body', 'header', 'query'],
  },
} as const satisfies WhookAPISchemaDefinition;

export const oAuth2ProtectedResourceMetadataSchema = {
  name: 'OAuth2ProtectedResourceMetadataSchema',
  schema: {
    type: 'object',
    required: ['resource'],
    properties: {
      resource: {
        type: 'string',
        format: 'uri',
      },
      authorization_servers: {
        type: 'array',
        items: refersTo(httpsProtocolURISchema),
      },
      jwks_uri: refersTo(httpsProtocolURISchema),
      scopes_supported: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      bearer_methods_supported: {
        type: 'array',
        items: refersTo(bearerMethodSchema),
      },
      resource_signing_alg_values_supported: {
        type: 'array',
        items: refersTo(jsonWebAlgorithmsSchema),
      },
      resource_documentation: refersTo(httpsProtocolURISchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const definition = {
  method: 'get',
  path: '/.well-known/oauth-protected-resource',
  operation: {
    operationId: 'getOAuth2WellKnownProtectedResourceMetadata',
    summary: `Provide the [OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728).`,
    tags: ['oauth2'],
    parameters: [],
    responses: {
      '200': {
        description: 'Well known OAuth2 protected resource metadata found.',
        content: {
          'application/json': {
            schema: refersTo(oAuth2ProtectedResourceMetadataSchema),
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initGetOAuth2WellKnownProtectedResourceMetadata({
  BASE_URL,
  BASE_PATH = '',
  API,
  log,
}: {
  BASE_URL: string;
  BASE_PATH?: string;
  API: OpenAPI;
  log: LogService;
}) {
  if (BASE_PATH) {
    log(
      'warning',
      `⚠️ - Using a base path (${BASE_PATH}) breaks the well known URI discovery.`,
    );
  }
  if (!BASE_URL.startsWith('https')) {
    log(
      'warning',
      `⚠️ - OAuth2 protected resource metadata must use an HTTPS BASE_URL (${BASE_URL}).`,
    );
  }

  const body = {
    resource: `${BASE_URL}`,
    authorization_servers: [`${BASE_URL}`],
    bearer_methods_supported: ['header'] as const,
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
  autoService(initGetOAuth2WellKnownProtectedResourceMetadata),
  import.meta.url,
);
