import { autoHandler } from 'knifecycle';
import YError from 'yerror';
import { setURLError } from './getOAuth2Authorize';
import type {
  WhookAPIHandlerDefinition,
  WhookErrorsDescriptors,
  WhookAPIOperationConfig,
} from '@whook/whook';
import type {
  CheckApplicationService,
  OAuth2GranterService,
} from '../services/oAuth2Granters';
import type { LogService } from 'common-services';
import type { BaseAuthenticationData } from '@whook/authorization';

/* Architecture Note #2: OAuth2 acknowledge
This endpoint is to be used by the authentication SSR frontend
 to acknowlege that the user accepted the client request in it.
*/

export const definition: WhookAPIHandlerDefinition = {
  method: 'post',
  path: '/oauth2/acknowledge',
  operation: {
    operationId: 'postOAuth2Acknowledge',
    summary: `Implements the logic that allow the authentication frontend
 to get the [Redirection Endpoint](https://tools.ietf.org/html/rfc6749#section-3.1.2).`,
    tags: ['oauth2'],
    'x-whook': {
      private: true,
    } as WhookAPIOperationConfig,
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
};

export default autoHandler(postOAuth2Acknowledge);

async function postOAuth2Acknowledge<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData
>(
  {
    ERRORS_DESCRIPTORS,
    oAuth2Granters,
    checkApplication,
    log,
  }: {
    ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
    oAuth2Granters: OAuth2GranterService[];
    checkApplication: CheckApplicationService;
    log: LogService;
  },
  {
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
  }: {
    authenticationData: AUTHENTICATION_DATA;
    body: {
      responseType: string;
      clientId: string;
      redirectURI: string;
      scope: string;
      state: string;
      acknowledged: boolean;
      [name: string]: unknown;
    };
  },
) {
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

    if (!granter) {
      throw new YError('E_UNKNOWN_ACKNOWLEDGOR_TYPE', responseType);
    }

    const {
      applicationId,
      scope,
      ...additionalProperties
    } = await granter.acknowledger.acknowledge(
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
      url.searchParams.set(snakeCase(key), additionalProperties[key] as string),
    );
  } catch (err) {
    log('debug', '👫 - OAuth2 acknowledge error', err.code);
    log('debug-stack', err.stack);

    setURLError(
      url,
      err,
      ERRORS_DESCRIPTORS[err.code] || ERRORS_DESCRIPTORS.E_OAUTH2,
    );
  }

  return {
    status: 302,
    headers: {
      location: url.href,
    },
  };
}

function snakeCase(s: string): string {
  return s
    .split(/(?=(?<![A-Z])[A-Z])|[^a-zA-Z]+/)
    .map((s) => s.toLowerCase())
    .join('_');
}
