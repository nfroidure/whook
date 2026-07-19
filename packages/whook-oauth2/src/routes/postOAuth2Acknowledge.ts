import { autoService, location } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  codeChallengeMethodSchema,
  codeChallengeSchema,
  setURLError,
} from './getOAuth2Authorize.js';
import {
  type WhookRouteDefinition,
  type WhookErrorsDescriptors,
  refersTo,
} from '@whook/whook';
import {
  type CheckApplicationService,
  type OAuth2GranterService,
} from '../services/oAuth2Granters.js';
import { type LogService } from 'common-services';
import { type WhookAuthenticationData } from '@whook/authorization';

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
              scope: {
                type: 'string',
                description:
                  'See https://tools.ietf.org/html/rfc6749#section-3.3',
              },
              state: {
                type: 'string',
              },
              acknowledged: {
                type: 'boolean',
                description:
                  'Wether the user acknowledged the delegation or not.',
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
  oAuth2Granters: OAuth2GranterService<
    Record<string, unknown>,
    Record<string, unknown>,
    Record<string, unknown>
  >[];
  checkApplication: CheckApplicationService;
  log: LogService;
}
interface HandlerParameters {
  authenticationData: WhookAuthenticationData;
  body: {
    responseType: string;
    clientId: string;
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
  oAuth2Granters,
  checkApplication,
  log,
}: HandlerDependencies) {
  return async ({
    authenticationData: baseAuthenticationData,
    body: {
      responseType,
      clientId,
      redirectURI: baseRedirectURI,
      scope: demandedScope,
      state,
      acknowledged = false,
      ...additionalProperties
    },
  }: HandlerParameters) => {
    if (!baseAuthenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    // Here we check the applicationId has the right to authenticate a user
    // with the special type 'root'
    await checkApplication({
      applicationId: baseAuthenticationData.applicationId,
      type: 'root',
      scope: '',
    });

    let url: URL;

    try {
      if (!acknowledged) {
        throw new YError('E_ACCESS_DENIED', [clientId]);
      }

      const granter = oAuth2Granters.find(
        (granter) =>
          granter.acknowledger &&
          granter.acknowledger.acknowledgmentType === responseType,
      );

      if (!granter || !granter.acknowledger) {
        throw new YError('E_UNKNOWN_ACKNOWLEDGER_TYPE', [responseType]);
      }

      const { authenticationData, acknowledgedData, redirectURI } =
        await granter.acknowledger.acknowledge(
          baseAuthenticationData,
          {
            clientId,
            redirectURI: baseRedirectURI,
            scope: demandedScope,
          },
          additionalProperties,
        );

      url = new URL(redirectURI);

      url.searchParams.set('client_id', authenticationData.applicationId);
      url.searchParams.set('scope', authenticationData.scope);
      url.searchParams.set('state', state);
      Object.keys(acknowledgedData).forEach((key) =>
        url.searchParams.set(snakeCase(key), acknowledgedData[key] as string),
      );
    } catch (err) {
      log('debug', '👫 - OAuth2 acknowledge error', (err as YError).code);
      log('debug-stack', printStackTrace(err));

      url = new URL(baseRedirectURI);

      setURLError(
        url,
        err as YError,
        ERRORS_DESCRIPTORS[(err as YError).code] || ERRORS_DESCRIPTORS.E_OAUTH2,
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
