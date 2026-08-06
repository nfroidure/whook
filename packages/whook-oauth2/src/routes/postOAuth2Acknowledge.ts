import { autoService, location } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  type WhookRouteDefinition,
  type WhookErrorsDescriptors,
  refersTo,
} from '@whook/whook';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2GranterService,
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2ClientId,
} from '../services/oAuth2Granters.js';
import { type LogService } from 'common-services';
import { type WhookAuthenticationData } from '@whook/authorization';
import {
  filterScopes,
  parseOAuth2Scope,
  stringifyScopes,
} from '../libs/scopes.js';
import { scopeSchema } from '../libs/schemas.js';
import {
  codeChallengeMethodSchema,
  codeChallengeSchema,
} from '../services/oAuth2AuthorizationCodeGranter.js';
import { addParamsToURL, buildParamsFromError } from '../libs/redirectURI.js';

export { scopeSchema, codeChallengeMethodSchema, codeChallengeSchema };

/* Architecture Note #2: OAuth2 acknowledge

This endpoint is to be used by the authentication SSR frontend
 to acknowledge that the user accepted the client request in it.
*/

export const definition = {
  method: 'post',
  path: '/oauth2/acknowledge',
  config: {
    private: true,
  },
  operation: {
    operationId: 'postOAuth2Acknowledge',
    summary: `Implements the logic that allow the authentication frontend
 to get the [Redirection Endpoint](https://tools.ietf.org/html/rfc6749#section-3.1.2).`,
    tags: ['oauth2'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: [
              'responseType',
              'clientId',
              'redirectURI',
              'scope',
              'state',
              'acknowledged',
            ],
            properties: {
              responseType: {
                type: 'string',
              },
              clientId: {
                type: 'string',
              },
              redirectURI: {
                type: 'string',
                pattern: '^https?://',
                format: 'uri',
              },
              scope: refersTo(scopeSchema),
              state: {
                type: 'string',
              },
              acknowledged: {
                type: 'boolean',
                description:
                  'Whether the user acknowledged the delegation or not.',
              },
              codeChallenge: refersTo(codeChallengeSchema),
              codeChallengeMethod: refersTo(codeChallengeMethodSchema),
            },
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Redirection endpoint URI computed.',
        headers: {
          location: {
            schema: {
              type: 'string',
            },
          },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['redirectURI'],
              properties: {
                redirectURI: {
                  type: 'string',
                  pattern: '^https?://',
                  format: 'uri',
                },
              },
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

export interface HandlerDependencies {
  ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
  OAUTH2: WhookOAuth2Options;
  oAuth2Granters: WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  log: LogService;
}
interface HandlerParameters {
  authenticationData: WhookAuthenticationData;
  body: {
    responseType: string;
    clientId: WhookOAuth2ClientId;
    redirectURI: string;
    scope: string;
    state: string;
    acknowledged: boolean;
    [name: string]: unknown;
  };
}

export default location(
  autoService(initPostOAuth2Acknowledge),
  import.meta.url,
) as unknown as (
  dependencies: HandlerDependencies,
) => (
  parameters: HandlerParameters,
) => ReturnType<typeof initPostOAuth2Acknowledge>;

async function initPostOAuth2Acknowledge({
  ERRORS_DESCRIPTORS,
  OAUTH2,
  oAuth2Granters,
  readClientGrants,
  log,
}: HandlerDependencies) {
  return async ({
    authenticationData: userAuthenticationData,
    body: {
      responseType,
      clientId,
      redirectURI: demandedRedirectURI,
      scope: demandedScope,
      state,
      acknowledged = false,
      ...additionalProperties
    },
  }: HandlerParameters) => {
    if (!userAuthenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    const acknowledgeClientGrants = await readClientGrants(
      userAuthenticationData.clientId,
    );

    if (!acknowledgeClientGrants.canAcknowledge) {
      throw new YError('E_UNAUTHORIZED');
    }

    let url: URL;

    try {
      if (!acknowledged) {
        throw new YError('E_OAUTH2_ACCESS_DENIED', [clientId]);
      }

      const granter = oAuth2Granters.find(
        (granter) => granter.responseType === responseType,
      );

      if (!granter?.acknowledge) {
        throw new YError('E_OAUTH2_UNKNOWN_ACKNOWLEDGER_TYPE', [responseType]);
      }

      const demandedScopes = filterScopes(
        parseOAuth2Scope(demandedScope),
        OAUTH2.allowedScopes,
        !!OAUTH2.strictScopesChecks,
      );

      const {
        acknowledgedAuthenticationData,
        acknowledgedData,
        acknowledgedRedirectURI,
      } = await granter.acknowledge(
        userAuthenticationData,
        {
          clientId,
          demandedRedirectURI,
          demandedScopes,
        },
        additionalProperties,
      );

      url = new URL(acknowledgedRedirectURI);

      const paramsHash: Record<string, string> = {
        client_id: acknowledgedAuthenticationData.clientId,
        scope: stringifyScopes(acknowledgedAuthenticationData.scopes),
        state: state,
      };

      Object.keys(acknowledgedData).forEach((key) => {
        if (typeof acknowledgedData[key] === 'number') {
          paramsHash[snakeCase(key)] = acknowledgedData[key].toString(10);
        } else if (typeof acknowledgedData[key] === 'string') {
          paramsHash[snakeCase(key)] = acknowledgedData[key];
        }
      });

      addParamsToURL(
        url,
        paramsHash,
        responseType === 'token' ? 'fragment' : 'query',
      );
    } catch (err) {
      log('debug', '👫 - OAuth2 acknowledge error', (err as YError).code);
      log('debug-stack', printStackTrace(err));

      url = new URL(demandedRedirectURI);

      const paramsHash = buildParamsFromError(
        err as YError,
        ERRORS_DESCRIPTORS[(err as YError).code] ||
          ERRORS_DESCRIPTORS.E_OAUTH2_UNEXPECTED_ERROR,
      );

      addParamsToURL(
        url,
        paramsHash,
        responseType === 'token' ? 'fragment' : 'query',
      );
    }

    return {
      status: 201,
      headers: {
        location: url.href,
      },
    };
  };
}

function snakeCase(s: string): string {
  return s
    .split(/(?=(?<![A-Z])[A-Z])|[^a-zA-Z]+/)
    .map((s) => s.toLowerCase())
    .join('_');
}
