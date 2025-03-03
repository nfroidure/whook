import { autoService, type Injector, type Service } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import miniquery from 'miniquery';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type WhookCommand,
  type WhookCommandDefinition,
} from '../types/commands.js';

export const definition = {
  name: 'inspect',
  description:
    'A simple program that returns the result of the injected service',
  example: `whook config --name API_DEFINITIONS --query 'paths.*'`,
  config: { promptArgs: true },
  arguments: [
    {
      name: 'name',
      required: true,
      description: 'Injected service name',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'query',
      description: 'Property to pickup in the result (uses `miniquery`)',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'default',
      description: 'Provide a default value',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'pretty',
      description: 'Pretty JSON output',
      schema: {
        type: 'boolean',
        default: false,
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initInspectCommand({
  $injector,
  log = noop,
}: {
  $injector: Injector<Service>;
  log?: LogService;
}): Promise<
  WhookCommand<{
    name: string;
    query?: string;
    default?: string;
    pretty?: true;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name, query, default: defaultValue, pretty },
    } = args;
    let service;

    try {
      const injectionResult = await $injector([name]);

      service = injectionResult[name];
    } catch (err) {
      log('error', `No service found for "${name}".`);
      log('error-stack', printStackTrace(err as Error));
      log('error', `Try debugging with the "DEBUG=whook" env.`);
      if ('undefined' === typeof defaultValue) {
        throw new YError('E_NO_SERVICE_FOUND', name);
      }

      log('info', `${JSON.stringify(defaultValue, null, pretty ? 2 : 0)}`);
      return;
    }

    const results = query ? miniquery(query, [service]) : [service];

    if (!results.length) {
      log('error', `Could not find any results for "${query}".`);
      if ('undefined' === typeof defaultValue) {
        throw new YError('E_NO_RESULT', name, query);
      }
    }

    if (results.length > 1) {
      log(
        'error',
        `Got ${results.length} results for the "${query}" query, picking-up the first one.`,
      );
    }

    log(
      'info',
      `${JSON.stringify(
        results.length ? results[0] : defaultValue,
        null,
        pretty ? 2 : 0,
      )}`,
    );
  };
}

export default autoService(initInspectCommand);
