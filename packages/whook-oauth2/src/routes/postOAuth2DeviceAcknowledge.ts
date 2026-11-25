import { autoService, location } from 'knifecycle';
import {
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
} from '@whook/whook';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2ClientId,
} from '../services/oAuth2Granters.js';
import {
  DEVICE_AUTHORIZATION_GRANT_TYPE,
  type WhookOAuth2UserCode,
  type WhookOAuth2DeviceAuthorizationCodeService,
} from '../services/oAuth2DeviceAuthorizationGranter.js';
import { checkGrants } from '../libs/clients.js';
import { checkGrantType } from '../libs/grants.js';
import { filterScopes, parseOAuth2Scope } from '../libs/scopes.js';
import { clientIdSchema, scopeSchema } from './schemas.js';
import { type WhookAuthenticationData } from '@whook/authorization';
import { userCodeSchema } from './postOAuth2DeviceAuthorization.js';
import { YError } from 'yerror';

export const deviceAcknowledgeRequestBodySchema = {
  name: 'DeviceAcknowledgeRequestBody',
  schema: {
    type: 'object',
    description: 'Device acknowledge request',
    required: ['clientId', 'userCode', 'scope', 'acknowledged'],
    properties: {
      clientId: refersTo(clientIdSchema),
      userCode: refersTo(userCodeSchema),
      scope: refersTo(scopeSchema),
      acknowledged: {
        type: 'boolean',
        description: 'Whether the user acknowledged the delegation or not.',
      },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const definition = {
  method: 'post',
  path: '/oauth2/device_acknowledge',
  config: {
    environments: [],
    private: true,
  },
  operation: {
    operationId: 'postOAuth2DeviceAcknowledge',
    summary: `Implements the logic that allow the authentication frontend
 to process the [Device Authorization](https://datatracker.ietf.org/doc/html/rfc8628#section-3.1).`,
    tags: ['oauth2'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: refersTo(deviceAcknowledgeRequestBodySchema),
        },
      },
    },
    responses: {
      '204': {
        description: 'Device authorization acknowledged.',
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPostOAuth2DeviceAcknowledge({
  OAUTH2,
  readClientGrants,
  oAuth2DeviceAuthorizationCode,
}: {
  OAUTH2: WhookOAuth2Options;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  oAuth2DeviceAuthorizationCode: Pick<
    WhookOAuth2DeviceAuthorizationCodeService,
    'acknowledge'
  >;
}) {
  return async ({
    body: { clientId, userCode, scope: demandedScope, acknowledged },
    authenticationData: userAuthenticationData,
  }: {
    body: {
      clientId: WhookOAuth2ClientId;
      userCode: WhookOAuth2UserCode;
      scope: string;
      acknowledged: boolean;
    };
    authenticationData: WhookAuthenticationData;
  }) => {
    if (!userAuthenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    const acknowledgeClientGrants = await readClientGrants(
      userAuthenticationData.clientId,
    );

    checkGrants(userAuthenticationData.clientId, acknowledgeClientGrants);

    if (!acknowledgeClientGrants.canAcknowledge) {
      throw new YError('E_UNAUTHORIZED');
    }

    try {
      const clientGrants = await readClientGrants(clientId);

      checkGrants(clientId, clientGrants);

      checkGrantType(
        clientGrants.allowedGrantTypes,
        DEVICE_AUTHORIZATION_GRANT_TYPE,
      );

      const filteredScopes = filterScopes(
        filterScopes(
          filterScopes(
            parseOAuth2Scope(demandedScope),
            OAUTH2.allowedScopes,
            !!OAUTH2.strictScopesChecks,
          ),
          clientGrants.allowedScopes,
          !!OAUTH2.strictScopesChecks,
        ),
        userAuthenticationData.scopes,
        !!OAUTH2.strictScopesChecks,
      );

      await oAuth2DeviceAuthorizationCode.acknowledge(
        acknowledged,
        userAuthenticationData,
        userCode,
        clientId,
        filteredScopes,
      );

      return {
        status: 204,
        headers: {},
      };
    } catch (err) {
      // Ensure to break device acknoledgement wait when
      // unexpected errors arise
      throw YError.wrap(err as Error, 'E_UNAUTHORIZED');
    }
  };
}

export default location(
  autoService(initPostOAuth2DeviceAcknowledge),
  import.meta.url,
);
