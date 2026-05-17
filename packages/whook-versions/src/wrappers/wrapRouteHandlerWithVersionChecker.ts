import { YHTTPError } from 'yhttperror';
import { satisfies as semverSatisfies } from 'semver';
import { autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  noop,
  pickFirstHeaderValue,
  type WhookResponse,
  type WhookRouteHandler,
  type WhookRouteHandlerWrapper,
  type WhookRouteHandlerParameters,
  type WhookRouteDefinition,
  type WhookHeaders,
} from '@whook/whook';

export interface VersionDescriptor {
  header: string;
  rule: string;
}
export interface VersionsConfig {
  VERSIONS: VersionDescriptor[];
}
export type VersionsCheckerDependencies = VersionsConfig & {
  log: LogService;
};

/**
 * Wrap a route handler to append CORS to response.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   services.VERSIONS
 * A VERSIONS object with the versions configuration
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
async function initWrapRouteHandlerWithVersionChecker({
  VERSIONS,
  log = noop,
}: VersionsCheckerDependencies): Promise<
  WhookRouteHandlerWrapper<WhookRouteHandler>
> {
  log('debug', '📥 - Initializing the version checker wrapper.');

  const wrapper = async (
    handler: WhookRouteHandler,
  ): Promise<WhookRouteHandler> => {
    const wrappedHandler = handleWithVersionChecker.bind(
      null,
      { VERSIONS, log },
      handler,
    );

    return wrappedHandler;
  };

  return wrapper;
}

async function handleWithVersionChecker(
  { VERSIONS }: VersionsCheckerDependencies,
  handler: WhookRouteHandler,
  parameters: WhookRouteHandlerParameters,
  definition?: WhookRouteDefinition,
): Promise<WhookResponse> {
  VERSIONS.forEach((version) => {
    const value = pickFirstHeaderValue(
      version.header,
      parameters.headers as WhookHeaders,
    );

    if (
      'undefined' !== typeof value &&
      !semverSatisfies(value, version.rule, { includePrerelease: true })
    ) {
      throw new YHTTPError(418, 'E_DEPRECATED_VERSION', [
        version.header,
        value,
        version.rule,
      ]);
    }
  });

  return await handler(parameters, definition);
}

export default autoService(initWrapRouteHandlerWithVersionChecker);
