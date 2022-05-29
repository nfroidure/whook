import { autoHandler } from 'knifecycle';
import camelCase from 'camelcase';
import { YError } from 'yerror';
import { refersTo } from '@whook/whook';
import type {
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookResponse,
  WhookErrorsDescriptors,
  WhookErrorDescriptor,
} from '@whook/whook';
import type {
  OAuth2Options,
  OAuth2GranterService,
} from '../services/oAuth2Granters';
import type { LogService } from 'common-services';

/* Architecture Note #1: OAuth2 authorize
This endpoint simply redirect the user to the authentication
 server page by first checking the application details are
 fine.
*/

export const responseTypeParameter: WhookAPIParameterDefinition = {
  name: 'responseType',
  parameter: {
    in: 'query',
    name: 'response_type',
    required: true,
    schema: {
      type: 'string',
      enum: ['code', 'token'],
    },
  },
};
export const clientIdParameter: WhookAPIParameterDefinition = {
  name: 'clientId',
  parameter: {
    in: 'query',
    name: 'client_id',
    required: true,
    schema: {
      type: 'string',
    },
  },
};
export const redirectURIParameter: WhookAPIParameterDefinition = {
  name: 'redirectURI',
  parameter: {
    in: 'query',
    name: 'redirect_uri',
    required: false,
    schema: {
      type: 'string',
      pattern: '^https?://',
      format: 'uri',
    },
  },
};
export const scopeParameter: WhookAPIParameterDefinition = {
  name: 'scope',
  parameter: {
    in: 'query',
    name: 'scope',
    description: 'See https://tools.ietf.org/html/rfc6749#section-3.3',
    required: false,
    schema: {
      type: 'string',
    },
  },
};
export const stateParameter: WhookAPIParameterDefinition = {
  name: 'state',
  parameter: {
    in: 'query',
    name: 'state',
    required: true,
    schema: {
      type: 'string',
    },
  },
};

export const definition: WhookAPIHandlerDefinition = {
  method: 'get',
  path: '/oauth2/authorize',
  operation: {
    operationId: 'getOAuth2Authorize',
    summary: `Implements the [Authorization Endpoint](https://tools.ietf.org/html/rfc6749#section-3.1)
 as defined per the OAuth2 RFC.`,
    tags: ['oauth2'],
    parameters: [
      refersTo(responseTypeParameter),
      refersTo(clientIdParameter),
      refersTo(redirectURIParameter),
      refersTo(scopeParameter),
      refersTo(stateParameter),
    ],
    responses: {
      '302': {
        description: 'Redirects the user to the authorization interface.',
      },
    },
  },
};

export default autoHandler(getOAuth2Authorize);

async function getOAuth2Authorize(
  {
    OAUTH2,
    ERRORS_DESCRIPTORS,
    oAuth2Granters,
    log,
  }: {
    OAUTH2: OAuth2Options;
    ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
    oAuth2Granters: OAuth2GranterService[];
    log: LogService;
  },
  {
    response_type: responseType,
    client_id: clientId,
    redirect_uri: demandedRedirectURI = '',
    scope: demandedScope = '',
    state,
    ...authorizeParameters
  }: {
    response_type: string;
    client_id: string;
    redirect_uri?: string;
    scope?: string;
    state: string;
  } & Record<string, unknown>,
): Promise<WhookResponse<302, { location: string }>> {
  const url = new URL(OAUTH2.authenticateURL);

  try {
    const granter = oAuth2Granters.find(
      (granter) =>
        granter.authorizer && granter.authorizer.responseType === responseType,
    );

    if (!granter) {
      throw new YError('E_UNKNOWN_AUTHORIZER_TYPE', responseType);
    }

    const { applicationId, redirectURI, scope } = await (
      granter.authorizer as NonNullable<OAuth2GranterService['authorizer']>
    ).authorize(
      {
        clientId,
        redirectURI: demandedRedirectURI,
        scope: demandedScope,
      },
      camelCaseObjectProperties(authorizeParameters),
    );

    url.searchParams.set('type', responseType);
    url.searchParams.set('redirect_uri', redirectURI);
    url.searchParams.set('scope', scope);
    url.searchParams.set('client_id', applicationId);
  } catch (err) {
    log('debug', '👫 - OAuth2 initialization error', (err as YError).code);
    log('debug-stack', (err as Error).stack || 'no_stack_trace');

    url.searchParams.set('redirect_uri', demandedRedirectURI);
    setURLError(
      url,
      err as YError,
      ERRORS_DESCRIPTORS[(err as YError).code] || ERRORS_DESCRIPTORS.E_OAUTH2,
    );
  }

  if (state) {
    url.searchParams.set('state', state);
  }

  return {
    status: 302,
    headers: {
      location: url.href,
    },
  };
}

// The OAuth2 standard uses snake case names so we are
// converting them to the project standards asap
export function camelCaseObjectProperties<T>(
  object: Record<string, T>,
): Record<string, T> {
  return Object.keys(object).reduce((camelCasedObject, key) => {
    const newKey = key === 'redirect_uri' ? 'redirectURI' : camelCase(key);

    camelCasedObject[newKey] = object[key];
    return camelCasedObject;
  }, {});
}

export function setURLError(
  url: URL,
  err: YError | Error,
  oAuth2Error: WhookErrorDescriptor,
): void {
  url.searchParams.set('error', oAuth2Error.code);
  if (oAuth2Error.description) {
    url.searchParams.set(
      'error_decription',
      oAuth2Error.description.replace(/\$([0-9]+)/g, (_, paramIndex) => {
        return ((err as YError).params || [])[parseInt(paramIndex, 10)];
      }),
    );
  }
}
