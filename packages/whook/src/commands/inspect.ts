import { extra, autoService, type Injector, type Service } from 'knifecycle';
import { readArgs } from '../libs/args.js';
import { printStackTrace, YError } from 'yerror';
import miniquery from 'miniquery';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type WhookPromptArgs,
  type WhookCommandDefinition,
  type WhookCommandHandler,
} from '../services/promptArgs.js';

export const definition: WhookCommandDefinition = {
  description:
    'A simple program that returns the result of the injected service',
  example: `whook config --name API_DEFINITIONS --query 'paths.*'`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Injected service name',
        type: 'string',
      },
      query: {
        description: 'Property to pickup in the result (uses `miniquery`)',
        type: 'string',
      },
      default: {
        description: 'Provide a default value',
        type: 'string',
      },
      pretty: {
        description: 'Pretty JSON output',
        type: 'boolean',
        default: false,
      },
    },
  },
};

export default extra(definition, autoService(initInspectCommand));

async function initInspectCommand({
  $injector,
  promptArgs,
  log = noop,
}: {
  $injector: Injector<Service>;
  promptArgs: WhookPromptArgs;
  log?: LogService;
}): Promise<WhookCommandHandler> {
  return async () => {
    const {
      namedArguments: { name, query, default: defaultValue, pretty },
    } = readArgs<{
      name: string;
      query: string;
      default: string;
      pretty: true;
    }>(definition.arguments, await promptArgs());
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
