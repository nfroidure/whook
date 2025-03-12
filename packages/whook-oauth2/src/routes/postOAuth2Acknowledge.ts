import { autoService, location } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import { setURLError } from './getOAuth2Authorize.js';
import {
  type WhookRouteDefinition,
  type WhookErrorsDescriptors,
} from '@whook/whook';
import {
  type CheckApplicationService,
  type OAuth2GranterService,
} from '../services/oAuth2Granters.js';
import { type LogService } from 'common-services';
import { type WhookAuthenticationData } from '@whook/authorization';

/* Architecture Note #2: OAuth2 acknowledge
This endpoint is to be used by the authentication SSR frontend
 to acknowlege that the user accepted the client request in it.
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
            },
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Redirection endpoint URI computed.',
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

export type HandlerDependencies = {
  ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
  oAuth2Granters: OAuth2GranterService<
    Record<string, unknown>,
    Record<string, unknown>,
    Record<string, unknown>
  >[];
  checkApplication: CheckApplicationService;
  log: LogService;
};
type HandlerParameters = {
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
};

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
    authenticationData,
    body: {
      responseType,
      clientId,
      redirectURI,
      scope: demandedScope,
      state,
      acknowledged = false,
      ...additionalParameters
    },
  }: HandlerParameters) => {
    if (!authenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    // Here we check the applicationId has the right to authenticate a user
    // with the special type 'root'
    await checkApplication({
      applicationId: authenticationData.applicationId,
      type: 'root',
      scope: '',
    });

    const url = new URL(redirectURI);

    try {
      if (!acknowledged) {
        throw new YError('E_ACCESS_DENIED', clientId);
      }

      const granter = oAuth2Granters.find(
        (granter) =>
          granter.acknowledger &&
          granter.acknowledger.acknowledgmentType === responseType,
      );

      if (!granter || !granter.acknowledger) {
        throw new YError('E_UNKNOWN_ACKNOWLEDGOR_TYPE', responseType);
      }

      const { applicationId, scope, ...additionalProperties } =
        await granter.acknowledger.acknowledge(
          authenticationData,
          {
            clientId,
            redirectURI,
            scope: demandedScope,
          },
          additionalParameters,
        );

      url.searchParams.set('client_id', applicationId);
      url.searchParams.set('scope', scope);
      url.searchParams.set('state', state);
      Object.keys(additionalProperties).forEach((key) =>
        url.searchParams.set(
          snakeCase(key),
          additionalProperties[key] as unknown as string,
        ),
      );
    } catch (err) {
      log('debug', '👫 - OAuth2 acknowledge error', (err as YError).code);
      log('debug-stack', printStackTrace(err as Error));

      setURLError(
        url,
        err as YError,
        ERRORS_DESCRIPTORS[(err as YError).code] || ERRORS_DESCRIPTORS.E_OAUTH2,
      );
    }

    return {
      status: 302,
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
