import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import { noop } from '../libs/utils.js';
import { type Injector } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  type WhookRouteHandler,
  type WhookRouteHandlerParameters,
  type WhookRouteDefinition,
} from '../types/routes.js';
import { type JsonObject } from 'type-fest';
import {
  type WhookCommandHandler,
  type WhookCommandDefinition,
} from '../types/commands.js';

export const definition = {
  name: 'route',
  description: 'Runs the given server route for testing purpose',
  example: `whook route --name getPing --parameters '{}'`,
  config: { promptArgs: true },
  arguments: [
    {
      name: 'name',
      required: true,
      description: 'Handler to invoke',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'parameters',
      required: true,
      description: 'Parameters to invoke the route with',
      schema: {
        type: 'string',
        default: '{}',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initRouteCommand({
  $injector,
  log = noop,
}: {
  $injector: Injector<Record<string, WhookRouteHandler>>;
  log?: LogService;
}): Promise<
  WhookCommandHandler<{
    name: string;
    parameters?: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name: routeName, parameters: routeParameters },
    } = args;
    let parsedParameters: WhookRouteHandlerParameters;

    try {
      parsedParameters = JSON.parse(routeParameters || '{}');
    } catch (err) {
      throw YError.wrap(err as Error, 'E_BAD_PARAMETERS', routeParameters);
    }

    log('debug', 'route', routeName);
    log('debug', 'parameters', parsedParameters as JsonObject);

    // Maybe infer and check command definition from route definition
    // with ajv or else

    try {
      const route = (await $injector([routeName]))[routeName];
      const response = await route(
        parsedParameters,
        undefined as unknown as WhookRouteDefinition,
      );

      log('info', JSON.stringify(response, null, 2));
    } catch (err) {
      log('error', 'Got an error while running the route.');
      log('error-stack', printStackTrace(err as Error));
    }
  };
}

export default autoService(initRouteCommand);
