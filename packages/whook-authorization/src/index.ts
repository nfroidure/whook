import {
  SPECIAL_PROPS,
  wrapInitializer,
  alsoInject,
  Dependencies,
  Service,
} from 'knifecycle';
import HTTPError from 'yhttperror';
import YError from 'yerror';
import { DEFAULT_ERROR_URI, DEFAULT_HELP_URI } from '@whook/whook';
import {
  parseAuthorizationHeader,
  buildWWWAuthenticateHeader,
  BEARER as BEARER_MECHANISM,
} from 'http-auth-utils';
import type { Mechanism } from 'http-auth-utils';
import type { ServiceInitializer, Parameters } from 'knifecycle';
import type {
  WhookHandler,
  WhookOperation,
  WhookErrorsDescriptors,
} from '@whook/whook';
import type { LogService } from 'common-services';
import YHTTPError from 'yhttperror';

export const AUTHORIZATION_ERRORS_DESCRIPTORS: WhookErrorsDescriptors = {
  E_OPERATION_REQUIRED: {
    code: 'server_misconfiguration',
    description:
      'The authorization wrapper needs to have the operation passed in',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNAUTHORIZED: {
    code: 'unauthorized_client',
    description: 'Access refused to this resource for the authenticated client',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNALLOWED_AUTH_MECHANISM: {
    code: 'bad_request',
    description: 'Unsupported auth mecanism',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_MISCONFIGURATION: {
    code: 'bad_handler',
    description:
      'The operation "$2" is misconfigured for the authorization type "$0"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
};

export type AuthenticationApplicationId = string;
export type AuthenticationScope = string;
export type BaseAuthenticationData<
  T = AuthenticationApplicationId,
  U = AuthenticationScope,
> = {
  applicationId: T;
  scope: U;
};

export interface AuthenticationService<A, R extends BaseAuthenticationData> {
  check: (type: string, data: A) => Promise<R>;
}

export type WhookAuthorizationConfig = {
  MECHANISMS?: typeof BEARER_MECHANISM[];
  DEFAULT_MECHANISM?: string;
};

export type WhookAuthorizationDependencies<
  A,
  R extends BaseAuthenticationData,
> = WhookAuthorizationConfig & {
  authentication: AuthenticationService<A, R>;
  log: LogService;
};

/**
 * Wrap an handler initializer to check client's authorizations.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export function wrapHandlerWithAuthorization(
  initHandler: ServiceInitializer<Dependencies, Service>,
): ServiceInitializer<Dependencies, Service> {
  const augmentedInitializer = alsoInject(
    ['?MECHANISMS', '?DEFAULT_MECHANISM', 'authentication', 'log'],
    initHandler,
  );

  return wrapInitializer(async (services, handler) => {
    const {
      MECHANISMS = [BEARER_MECHANISM],
      DEFAULT_MECHANISM = BEARER_MECHANISM.type,
      authentication,
      log,
    } = services;

    log(
      'debug',
      `🔐 - Initializing the authorization wrapper for "${
        initHandler[SPECIAL_PROPS.NAME]
      }".`,
    );

    return handleWithAuthorization.bind(
      null,
      {
        MECHANISMS,
        DEFAULT_MECHANISM,
        authentication,
        log,
      },
      handler,
    );
  }, augmentedInitializer);
}

async function handleWithAuthorization<
  P extends Parameters,
  A,
  R extends BaseAuthenticationData,
  WR,
>(
  {
    MECHANISMS,
    DEFAULT_MECHANISM,
    authentication,
    log,
  }: WhookAuthorizationDependencies<A, R>,
  handler: WhookHandler<P, WR, WhookOperation>,
  parameters: P,
  operation: WhookOperation,
): Promise<WR> {
  let response;

  // Since the operation embed the security rules
  // we need to ensure we got it here since, if for
  // any reason, the operation is not transmitted
  // then security will not be checked
  // and the API will have a big security hole.
  // TL;DR: DO NOT remove this line!
  if (!operation) {
    throw new HTTPError(500, 'E_OPERATION_REQUIRED');
  }

  const noAuth =
    'undefined' === typeof operation.security ||
    operation.security.length === 0;
  const optionalAuth = (operation.security || []).some(
    (security) => Object.keys(security).length === 0,
  );
  const authorization =
    parameters.access_token && DEFAULT_MECHANISM
      ? `${DEFAULT_MECHANISM} ${parameters.access_token}`
      : parameters.authorization;

  if (noAuth || (optionalAuth && !authorization)) {
    log(
      'debug',
      noAuth
        ? '🔓 - Public endpoint detected, letting the call pass through!'
        : '🔓 - Optionally authenticated enpoint detected, letting the call pass through!',
    );
    response = await handler(
      { ...parameters, authenticated: false },
      operation,
    );
  } else {
    let parsedAuthorization;

    const usableMechanisms = (MECHANISMS || []).filter((mechanism) =>
      (operation.security || []).find(
        (security) => security[`${mechanism.type.toLowerCase()}Auth`],
      ),
    ) as Mechanism[];

    try {
      if (!authorization) {
        log('debug', '🔐 - No authorization found, locking access!');
        throw new HTTPError(401, 'E_UNAUTHORIZED');
      }
      try {
        parsedAuthorization = parseAuthorizationHeader(
          authorization,
          usableMechanisms,
          { strict: false },
        );
      } catch (err) {
        // This code should be simplified by solving this issue
        // https://github.com/nfroidure/http-auth-utils/issues/2
        if (
          (err as YError).code === 'E_UNKNOWN_AUTH_MECHANISM' &&
          (MECHANISMS || []).some(
            (mechanism) =>
              authorization.substr(0, mechanism.type.length) === mechanism.type,
          )
        ) {
          throw HTTPError.wrap(err as Error, 400, 'E_UNALLOWED_AUTH_MECHANISM');
        }
        throw HTTPError.cast(err as Error, 400);
      }

      const authName = `${parsedAuthorization.type.toLowerCase()}Auth`;
      const requiredScopes = ((operation.security || []).find(
        (security) => security[authName],
      ) || { [authName]: [] })[authName];

      // If security exists, we need at least one scope
      if (!(requiredScopes && requiredScopes.length)) {
        throw new HTTPError(
          500,
          'E_MISCONFIGURATION',
          parsedAuthorization.type,
          requiredScopes,
          operation.operationId,
        );
      }

      let authenticationData: R;

      try {
        authenticationData = await authentication.check(
          parsedAuthorization.type.toLowerCase(),
          parsedAuthorization.data,
        );
      } catch (err) {
        throw HTTPError.cast(err as Error, 401);
      }

      // Check scopes
      if (
        !requiredScopes.some((requiredScope) =>
          authenticationData.scope.split(',').includes(requiredScope),
        )
      ) {
        throw new HTTPError(
          403,
          'E_UNAUTHORIZED',
          authenticationData.scope,
          requiredScopes,
        );
      }

      response = await handler(
        {
          ...parameters,
          authenticationData,
          authenticated: true,
        },
        operation,
      );
      response = {
        ...response,
        headers: {
          ...(response.headers || {}),
          'X-Authenticated': JSON.stringify(authenticationData),
        },
      };
    } catch (err) {
      if ('undefined' === typeof operation.security) {
        throw err;
      }

      if ((err as YHTTPError).httpCode !== 401) {
        throw err;
      }

      const firstMechanism = usableMechanisms[0];

      (err as YHTTPError).headers = {
        ...((err as YHTTPError).headers || {}),
        'www-authenticate': buildWWWAuthenticateHeader(firstMechanism, {
          realm: 'Auth',
        }),
      };

      throw err;
    }
  }
  return response;
}
