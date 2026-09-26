import { autoService, location } from 'knifecycle';
import { noop } from '@whook/whook';
import {
  type RandomBytesService,
  type LogService,
  type TimeService,
} from 'common-services';
import { type KVStoreService } from 'memory-kv-store';
import { type WhookOAuth2ClientId } from './oAuth2Granters.js';
import { YError } from 'yerror';
import {
  buildRequestURI,
  readRequestURI,
  type WhookOAuth2AuthorizationRequestURI,
} from '../libs/authorizationRequests.js';
import { type WhookOAuth2AuthorizeRequestParameters } from '../routes/getOAuth2Authorize.js';
import { checkClientsIds } from '../libs/clients.js';

export interface WhookOAuth2AuthorizationRequestData {
  clientId: WhookOAuth2ClientId;
  parameters: WhookOAuth2AuthorizeRequestParameters;
  expiresAt: number;
}

export interface WhookOAuth2AuthorizationRequestsOptions {
  /** Whether PAR is activated and required */
  mode: 'enabled' | 'required' | 'disabled';
  /** Time to live in milliseconds */
  ttl?: number;
}
export const DEFAULT_OAUTH2_PAR = {
  mode: 'disabled',
  ttl: 90 * 1000,
} as const satisfies WhookOAuth2AuthorizationRequestsOptions;

export interface WhookOAuth2AuthorizationRequestsConfig {
  OAUTH2_PAR?: WhookOAuth2AuthorizationRequestsOptions;
}

export interface WhookOAuth2AuthorizationRequestsDependencies extends WhookOAuth2AuthorizationRequestsConfig {
  oAuth2AuthorizationRequestsStore: Pick<
    KVStoreService<WhookOAuth2AuthorizationRequestData>,
    'set' | 'getDelete'
  >;
  randomBytes: RandomBytesService;
  time?: TimeService;
  log?: LogService;
}

/**
 * A service to create and check authorization requests
 */
export interface WhookOAuth2AuthorizationRequestsService {
  create: (
    clientId: WhookOAuth2ClientId,
    parameters: WhookOAuth2AuthorizeRequestParameters,
  ) => Promise<{
    requestURI: WhookOAuth2AuthorizationRequestURI;
    expiresIn: number;
  }>;
  check: (
    clientId: WhookOAuth2ClientId,
    requestURI: WhookOAuth2AuthorizationRequestURI,
  ) => Promise<WhookOAuth2AuthorizationRequestData | undefined>;
}

async function initOAuth2AuthorizationRequests({
  OAUTH2_PAR,
  oAuth2AuthorizationRequestsStore,
  randomBytes,
  time = Date.now.bind(Date),
  log = noop,
}: WhookOAuth2AuthorizationRequestsDependencies): Promise<WhookOAuth2AuthorizationRequestsService> {
  const oAuth2PAROptions: Required<WhookOAuth2AuthorizationRequestsOptions> = {
    ...DEFAULT_OAUTH2_PAR,
    ...OAUTH2_PAR,
  };

  log('debug', '👫 - OAuth2AuthorizationRequests Service Initialized!');

  const oAuth2AuthorizationRequests: WhookOAuth2AuthorizationRequestsService = {
    create: async (clientId, parameters) => {
      const currentTime = time();
      const requestId = (await randomBytes(16)).toString('base64url');
      const expiresAt = currentTime + oAuth2PAROptions.ttl;
      const request: WhookOAuth2AuthorizationRequestData = {
        parameters,
        expiresAt,
        clientId,
      };

      await oAuth2AuthorizationRequestsStore.set(
        requestId,
        request,
        oAuth2PAROptions.ttl,
      );

      return {
        requestURI: buildRequestURI(requestId),
        expiresIn: oAuth2PAROptions.ttl,
      };
    },
    check: async (clientId, requestURI) => {
      const requestId = readRequestURI(requestURI);
      const currentTime = time();
      const request =
        await oAuth2AuthorizationRequestsStore.getDelete(requestId);

      if (!request) {
        throw new YError('E_OAUTH2_BAD_REQUEST_URI', [
          requestURI,
          undefined,
          undefined,
        ]);
      }

      if (request.expiresAt <= currentTime) {
        throw new YError('E_OAUTH2_BAD_REQUEST_URI', [
          requestURI,
          request.expiresAt,
          currentTime,
        ]);
      }

      checkClientsIds(clientId, [request.clientId]);

      return request;
    },
  };

  return oAuth2AuthorizationRequests;
}

export default location(
  autoService(initOAuth2AuthorizationRequests),
  import.meta.url,
);
