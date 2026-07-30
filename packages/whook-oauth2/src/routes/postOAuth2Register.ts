import { autoService, location } from 'knifecycle';
import { YError, printStackTrace } from 'yerror';
import { type LogService } from 'common-services';
import {
  noop,
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
} from '@whook/whook';
import {
  type OAuth2ClientRegistrationService,
  type OAuth2ClientRegistrationMetadata,
} from '../services/oAuth2Granters.js';
import { type WhookAuthenticationData } from '@whook/authorization';

export const endpointAuthenticationMethodsSchema = {
  name: 'OAuth2RegistrationEndpointAuthenticationMethods',
  schema: {
    type: 'string',
    enum: [
      'none',
      'client_secret_post',
      'client_secret_basic',
      'client_secret_jwt',
      'private_key_jwt',
    ],
  },
} as const satisfies WhookAPISchemaDefinition;

export const registrationRequestBodySchema = {
  name: 'OAuth2DynamicClientRegistrationRequestBody',
  schema: {
    type: 'object',
    required: ['redirect_uris'],
    properties: {
      redirect_uris: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          format: 'uri',
        },
      },
      token_endpoint_auth_method: refersTo(endpointAuthenticationMethodsSchema),
      grant_types: { type: 'array', items: { type: 'string' } },
      response_types: { type: 'array', items: { type: 'string' } },
      client_name: { type: 'string' },
      client_uri: { type: 'string', format: 'uri' },
      logo_uri: { type: 'string', format: 'uri' },
      scope: { type: 'string' },
      contacts: {
        type: 'array',
        items: {
          type: 'string',
          format: 'email',
        },
      },
      tos_uri: { type: 'string', format: 'uri' },
      policy_uri: { type: 'string', format: 'uri' },
      jwks_uri: { type: 'string', format: 'uri' },
      jwks: {
        type: 'object',
        additionalProperties: true,
      },
      software_id: { type: 'string' },
      software_version: { type: 'string' },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const registrationResponseBodySchema = {
  name: 'OAuth2DynamicClientRegistrationResponseBody',
  schema: {
    type: 'object',
    required: ['client_id', 'client_id_issued_at', 'client_secret_expires_at'],
    properties: {
      ...registrationRequestBodySchema.schema.properties,
      client_id: { type: 'string' },
      client_secret: { type: 'string' },
      client_id_issued_at: { type: 'number' },
      client_secret_expires_at: { type: 'number' },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const definition = {
  method: 'post',
  path: '/oauth2/register',
  operation: {
    operationId: 'postOAuth2Register',
    summary: `Implements [OAuth 2.0 Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591).`,
    tags: ['oauth2'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: refersTo(registrationRequestBodySchema),
        },
      },
    },
    responses: {
      '201': {
        description: 'Client successfully registered.',
        content: {
          'application/json': {
            schema: refersTo(registrationResponseBodySchema),
          },
        },
      },
      '400': {
        description: 'Client registration error.',
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPostOAuth2Register({
  oAuth2ClientRegistration,
  log = noop,
}: {
  oAuth2ClientRegistration: OAuth2ClientRegistrationService;
  log: LogService;
}) {
  return async ({
    body,
    authenticationData,
  }: {
    body: OAuth2ClientRegistrationMetadata;
    authenticationData?: WhookAuthenticationData;
  }) => {
    try {
      const responseBody = await oAuth2ClientRegistration.register(
        body,
        authenticationData,
      );

      return {
        status: 201,
        body: responseBody,
      };
    } catch (err) {
      log(
        'debug',
        '👫 - OAuth2 dynamic client registration error',
        (err as YError).code,
      );
      log('error-stack', printStackTrace(err));
      throw YError.cast(err as Error, 'E_OAUTH2');
    }
  };
}

export default location(autoService(initPostOAuth2Register), import.meta.url);
