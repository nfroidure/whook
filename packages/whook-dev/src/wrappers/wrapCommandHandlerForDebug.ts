import { autoService } from 'knifecycle';
import { printStackTrace } from 'yerror';
import { type JsonValue } from 'type-fest';
import {
  type WhookCommandHandler,
  type WhookCommandHandlerWrapper,
  type WhookCommandDefinition,
  type WhookHandlerWrapperDefinition,
  type WhookArgsTypes,
  type WhookCommandArgs,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';

export interface WhookDebugDependencies {
  log?: LogService;
}

export const definition = {
  name: 'wrapCommandHandlerForDebug',
  type: 'command',
  config: {
    targets: 'select',
  },
} as const satisfies WhookHandlerWrapperDefinition;

/**
 * Wrap a command handler for debug
 * @param  {Object}   services
 * The service dependencies
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a command handler wrapped for debug
 */
async function initWrapCommandHandlerForDebug({
  log = noop,
}: WhookDebugDependencies): Promise<
  WhookCommandHandlerWrapper<Record<string, WhookArgsTypes>>
> {
  log('debug', '📥 - Initializing the command debug wrapper.');

  const wrapper = async (
    handler: WhookCommandHandler<Record<string, WhookArgsTypes>>,
  ): Promise<WhookCommandHandler<Record<string, WhookArgsTypes>>> => {
    const wrappedHandler = handleWithDebug.bind(null, { log }, handler);

    return wrappedHandler;
  };

  return wrapper;
}

async function handleWithDebug(
  { log = noop }: WhookDebugDependencies,
  handler: WhookCommandHandler<Record<string, WhookArgsTypes>>,
  parameters: WhookCommandArgs<Record<string, WhookArgsTypes>>,
  definition?: WhookCommandDefinition,
): Promise<void> {
  log(
    'warning',
    `🚩 - Executing a command handler with parameters:`,
    definition?.name as JsonValue,
    definition?.description as JsonValue,
    parameters as unknown as JsonValue,
  );

  try {
    const response = await handler(parameters, definition);

    log(
      'warning',
      `🚩 - Succesful execution of a command handler with response:`,
      definition?.name as JsonValue,
      definition?.description as JsonValue,
      response as unknown as JsonValue,
    );

    return response;
  } catch (err) {
    log(
      'error',
      `🚩 - Error while executing a command handler:`,
      definition?.name as JsonValue,
      definition?.description as JsonValue,
    );
    log('debug-stack', printStackTrace(err));
    throw err;
  }
}

export default autoService(initWrapCommandHandlerForDebug);
