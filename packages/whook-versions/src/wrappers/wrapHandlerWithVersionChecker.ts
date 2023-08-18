import { YHTTPError } from 'yhttperror';
import semverSatisfies from 'semver/functions/satisfies.js';
import camelCase from 'camelcase';
import { noop } from '@whook/whook';
import { autoService } from 'knifecycle';
import type { Parameters } from 'knifecycle';
import type { LogService } from 'common-services';
import type {
  WhookResponse,
  WhookHandler,
  WhookOperation,
  WhookWrapper,
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
async function initWrapHandlerWithVersionChecker<S extends WhookHandler>({
  VERSIONS,
  log = noop,
}: VersionsCheckerDependencies): Promise<WhookWrapper<S>> {
  log('debug', '📥 - Initializing the version checker wrapper.');

  const wrapper = async (handler: S): Promise<S> => {
    const wrappedHandler = handleWithVersionChecker.bind(
      null,
      { VERSIONS, log },
      handler,
    );

    return wrappedHandler as S;
  };

  return wrapper;
}

async function handleWithVersionChecker<
  R extends WhookResponse,
  O extends WhookOperation,
  P extends Parameters,
>(
  { VERSIONS }: VersionsCheckerDependencies,
  handler: WhookHandler<P, R, O>,
  parameters: P,
  operation: O,
): Promise<R> {
  VERSIONS.forEach((version) => {
    const value = parameters[camelCase(version.header)];

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
