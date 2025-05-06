import { autoService } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { YError } from 'yerror';
import {
  parseAuthorizationHeader,
  buildWWWAuthenticateHeader,
  BEARER as BEARER_MECHANISM,
} from 'http-auth-utils';
import { type Mechanism } from 'http-auth-utils';
import {
  type WhookRouteDefinition,
  type WhookRouteHandlerParameters,
  type WhookResponse,
  type WhookRouteHandler,
  type WhookRouteHandlerWrapper,
} from '@whook/whook';
import { type LogService } from 'common-services';

export type WhookAuthenticationApplicationId = string;
export type WhookAuthenticationScope = string;
export type WhookBaseAuthenticationData = {
  applicationId: WhookAuthenticationApplicationId;
  scope: WhookAuthenticationScope;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookAuthenticationData extends WhookBaseAuthenticationData {}

export type WhookAuthenticationExtraParameters = {
  authenticationData?: WhookAuthenticationData;
  authenticated?: boolean;
};

export interface WhookAuthenticationService<A> {
  check: (type: string, data: A) => Promise<WhookAuthenticationData>;
}
export type WhookAuthorizationConfig = {
  MECHANISMS?: (typeof BEARER_MECHANISM)[];
  DEFAULT_MECHANISM?: string;
};
export type WhookAuthorizationDependencies<A> = WhookAuthorizationConfig & {
  authentication: WhookAuthenticationService<A>;
  log: LogService;
};

/**
 * Wrap a route handler to check client's authorizations.
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Array}   [services.MECHANISMS]
 * The list of supported auth mechanisms
 * @param  {string}   [services.DEFAULT_MECHANISM]
 * The default authentication mechanism
 * @param  {Object}   services.authentication
 * The authentication service
 * @param  {Object}   services.log
 * A logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
async function initWrapRouteHandlerWithAuthorization<A>({
  MECHANISMS = [BEARER_MECHANISM],
  DEFAULT_MECHANISM = BEARER_MECHANISM.type,
  authentication,
  log,
}: WhookAuthorizationDependencies<A>): Promise<WhookRouteHandlerWrapper> {
  log('debug', `🔐 - Initializing the authorization wrapper.`);

  const wrapper = async (
    handler: WhookRouteHandler,
  ): Promise<WhookRouteHandler> => {
    const wrappedHandler = handleWithAuthorization.bind(
      null,
      {
        MECHANISMS,
        DEFAULT_MECHANISM,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authentication: authentication as any,
        log,
      },
      handler,
    );

    return wrappedHandler;
  };

  return wrapper;
}

async function handleWithAuthorization<A>(
  {
    MECHANISMS,
    DEFAULT_MECHANISM,
    authentication,
    log,
  }: WhookAuthorizationDependencies<A>,
  handler: WhookRouteHandler,
  parameters: WhookRouteHandlerParameters,
  definition: WhookRouteDefinition,
): Promise<WhookResponse> {
  let response;

  // Since the operation embed the security rules
  // we need to ensure we got it here since, if for
  // any reason, the operation is not transmitted
  // then security will not be checked
  // and the API will have a big security hole.
  // TL;DR: DO NOT remove this line!
  if (!definition) {
    throw new YHTTPError(500, 'E_OPERATION_REQUIRED');
  }

  const noAuth =
    'undefined' === typeof definition.operation.security ||
    definition.operation.security.length === 0;
  const optionalAuth = (definition.operation.security || []).some(
    (security) => Object.keys(security).length === 0,
  );
  const authorization = (
    parameters.query.access_token && DEFAULT_MECHANISM
      ? `${DEFAULT_MECHANISM} ${parameters.query.access_token}`
      : parameters.headers.authorization
  ) as string;

  if (noAuth || (optionalAuth && !authorization)) {
    log(
      'debug',
      noAuth
        ? '🔓 - Public endpoint detected, letting the call pass through!'
        : '🔓 - Optionally authenticated enpoint detected, letting the call pass through!',
    );
    response = await handler(
      { ...parameters, authenticated: false },
      definition,
    );
  } else {
    let parsedAuthorization;

    const usableMechanisms = (MECHANISMS || []).filter((mechanism) =>
      (definition.operation.security || []).find(
        (security) => security[`${mechanism.type.toLowerCase()}Auth`],
      ),
    ) as Mechanism[];

    try {
      if (!authorization) {
        log('debug', '🔐 - No authorization found, locking access!');
        throw new YHTTPError(401, 'E_UNAUTHORIZED');
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
          throw YHTTPError.wrap(
            err as Error,
            400,
            'E_AUTH_MECHANISM_NOT_ALLOWED',
          );
        }
        throw YHTTPError.cast(err as Error, 400);
      }

      const authName = `${parsedAuthorization.type.toLowerCase()}Auth`;
      const requiredScopes = ((definition.operation.security || []).find(
        (security) => security[authName],
      ) || { [authName]: [] })[authName];

      // If security exists, we need at least one scope
      if (!(requiredScopes && requiredScopes.length)) {
        throw new YHTTPError(
          500,
          'E_MISCONFIGURATION',
          parsedAuthorization.type,
          requiredScopes,
          definition.operation.operationId,
        );
      }

      let authenticationData: WhookAuthenticationData;

      try {
        authenticationData = await authentication.check(
          parsedAuthorization.type.toLowerCase(),
          parsedAuthorization.data,
        );
      } catch (err) {
        throw YHTTPError.cast(err as Error, 401);
      }

      // Check scopes
      if (
        !requiredScopes.some((requiredScope) =>
          authenticationData.scope.split(',').includes(requiredScope),
        )
      ) {
        throw new YHTTPError(
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
        definition,
      );
      response = {
        ...response,
        headers: {
          ...(response.headers || {}),
          'X-Authenticated': JSON.stringify(authenticationData),
        },
      };
    } catch (err) {
      if ('undefined' === typeof definition.operation.security) {
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

export default autoService(initWrapRouteHandlerWithAuthorization);
