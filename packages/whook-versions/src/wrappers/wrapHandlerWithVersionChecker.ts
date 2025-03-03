import { YHTTPError } from 'yhttperror';
import semverSatisfies from 'semver/functions/satisfies.js';
import { autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  noop,
  type WhookResponse,
  type WhookAPIHandler,
  type WhookAPIWrapper,
  type WhookAPIHandlerParameters,
  type WhookAPIHandlerDefinition,
} from '@whook/whook';

export type VersionDescriptor = {
  header: string;
  rule: string;
};
export type VersionsConfig = {
  VERSIONS: VersionDescriptor[];
};
export type VersionsCheckerDependencies = VersionsConfig & {
  log: LogService;
};

/**
 * Wrap an handler to append CORS to response.
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   services.VERSIONS
 * A VERSIONS object with the versions configuration
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
async function initWrapHandlerWithVersionChecker({
  VERSIONS,
  log = noop,
}: VersionsCheckerDependencies): Promise<WhookAPIWrapper> {
  log('debug', '📥 - Initializing the version checker wrapper.');

  const wrapper = async (
    handler: WhookAPIHandler,
  ): Promise<WhookAPIHandler> => {
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
  handler: WhookAPIHandler,
  parameters: WhookAPIHandlerParameters,
  operation: WhookAPIHandlerDefinition,
): Promise<WhookResponse> {
  VERSIONS.forEach((version) => {
    const value = parameters.header[version.header.toLowerCase()] as string;

    if (
      'undefined' !== typeof value &&
      !semverSatisfies(value, version.rule, { includePrerelease: true })
    ) {
      throw new YHTTPError(
        418,
        'E_DEPRECATED_VERSION',
        version.header,
        value,
        version.rule,
      );
    }
  });

  return await handler(parameters, operation);
}

export default autoService(initWrapHandlerWithVersionChecker);
