import {
  SPECIAL_PROPS,
  reuseSpecialProps,
  alsoInject,
  ServiceInitializer,
  Parameters,
  Dependencies,
} from 'knifecycle';
import HTTPError from 'yhttperror';
import { WhookHandler, WhookOperation } from '@whook/whook';
import { LogService } from 'common-services';
import {
  parseAuthorizationHeader,
  buildWWWAuthenticateHeader,
  BEARER as BEARER_MECHANISM,
} from 'http-auth-utils';

export interface AuthenticationService<A, R> {
  check: (type: string, data: A) => Promise<R>;
}

export type WhookAuthorizationConfig = {
  MECHANISMS?: typeof BEARER_MECHANISM[];
  DEFAULT_MECHANISM?: string;
};

export type WhookAuthorizationDependencies<A, R> = WhookAuthorizationConfig & {
  authentication: AuthenticationService<A, R>;
  log: LogService;
};

/**
 * Wrap an handler initializer to check client's authorizations.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export function wrapHandlerWithAuthorization<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D, S> {
  const newInitializer: ServiceInitializer<
    D,
    S
  > = initHandlerWithAuthorization.bind(null, initHandler);

  return alsoInject(
    ['?MECHANISMS', '?DEFAULT_MECHANISM', 'authentication', 'log'],
    reuseSpecialProps(initHandler, newInitializer),
  );
}

async function initHandlerWithAuthorization<A, R, D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: WhookAuthorizationDependencies<A, R> & D,
): Promise<S> {
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
  const handler: S = await initHandler(services as D);

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
}

async function handleWithAuthorization<P extends Parameters, A, R, WR>(
  {
    MECHANISMS,
    DEFAULT_MECHANISM,
    authentication,
    log,
  }: WhookAuthorizationDependencies<A, R>,
  handler: WhookHandler<WR, WhookOperation, P>,
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
    security => Object.keys(security).length === 0,
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

    const usableMechanisms = MECHANISMS.filter(mechanism =>
      operation.security.find(
        security => security[`${mechanism.type.toLowerCase()}Auth`],
      ),
    );

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
          err.code === 'E_UNKNOWN_AUTH_MECHANISM' &&
          MECHANISMS.some(
            mechanism =>
              authorization.substr(0, mechanism.type.length) === mechanism.type,
          )
        ) {
          throw HTTPError.wrap(err, 400, 'E_UNALLOWED_AUTH_MECHANISM');
        }
        throw HTTPError.cast(err, 400);
      }

      const authName = `${parsedAuthorization.type.toLowerCase()}Auth`;
      const requiredScopes = (operation.security.find(
        security => security[authName],
      ) || { [authName]: [] })[authName];

      // If security exists, we need at least one scope
      if (!(requiredScopes && requiredScopes.length)) {
        throw new HTTPError(
          500,
          'E_MISCONFIGURATION',
          parsedAuthorization.type,
          requiredScopes,
        );
      }

      let authorizationContent;

      try {
        authorizationContent = await authentication.check(
          parsedAuthorization.type.toLowerCase(),
          parsedAuthorization.data,
        );
      } catch (err) {
        throw HTTPError.cast(err, 401);
      }

      // Check user id if present in parameters
      if (
        'undefined' !== typeof parameters.userId &&
        authorizationContent.userId !== parameters.userId
      ) {
        throw new HTTPError(
          403,
          'E_UNAUTHORIZED',
          authorizationContent.userId,
          parameters.userId,
        );
      }

      // Check scopes
      if (
        !requiredScopes.some(requiredScope =>
          authorizationContent.scopes.includes(requiredScope),
        )
      ) {
        throw new HTTPError(
          403,
          'E_UNAUTHORIZED',
          authorizationContent.scopes,
          requiredScopes,
        );
      }

      response = await handler(
        {
          ...parameters,
          ...authorizationContent,
          authenticated: true,
        },
        operation,
      );
      response = {
        ...response,
        headers: {
          ...(response.headers || {}),
          'X-Authenticated': JSON.stringify(authorizationContent),
        },
      };
    } catch (err) {
      if ('undefined' === typeof operation.security) {
        throw err;
      }

      if (err.httpCode !== 401) {
        throw err;
      }

      const firstMechanism = usableMechanisms[0];

      err.headers = {
        ...(err.headers || {}),
        'www-authenticate': buildWWWAuthenticateHeader(firstMechanism, {
          realm: 'Auth',
        }),
      };

      throw err;
    }
  }
  return response;
}
