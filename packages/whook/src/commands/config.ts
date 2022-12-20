import { extra, autoService } from 'knifecycle';
import { readArgs } from '../libs/args.js';
import { YError } from 'yerror';
import miniquery from 'miniquery';
import { noop } from '../libs/utils.js';
import type { CONFIGSService } from '../services/CONFIGS.js';
import type { LogService } from 'common-services';
import type {
  PromptArgs,
  WhookCommandDefinition,
  WhookCommandHandler,
} from '../services/promptArgs.js';

export const definition: WhookCommandDefinition = {
  description: 'A simple program that returns the queryed config value',
  example: `whook config --name MYSQL --query 'auth.username' --default root`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Configuration name',
        type: 'string',
      },
      query: {
        description: 'Property to pickup in config (uses `miniquery`)',
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

export default extra(definition, autoService(initConfigCommand));

async function initConfigCommand({
  CONFIGS,
  promptArgs,
  log = noop,
}: {
  CONFIGS: CONFIGSService;
  promptArgs: PromptArgs;
  log?: LogService;
}): Promise<WhookCommandHandler> {
  return async () => {
    const {
      namedArguments: { name, query, default: defaultValue, pretty },
    } = readArgs<{
      name: string;
      query: string;
      default: string;
      pretty: boolean;
    }>(definition.arguments, await promptArgs());

    if ('undefined' === typeof CONFIGS[name]) {
      log('error', `No config found for "${name}"`);
      if ('undefined' === typeof defaultValue) {
        throw new YError('E_NO_CONFIG', name);
      }
      log('info', `${JSON.stringify(defaultValue, null, pretty ? 2 : 0)}`);
      return;
    }

    const results = query ? miniquery(query, [CONFIGS[name]]) : [CONFIGS[name]];

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
