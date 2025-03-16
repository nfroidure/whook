import { location, autoService } from 'knifecycle';
import { YError } from 'yerror';
import miniquery from 'miniquery';
import { type AppConfig } from 'application-services';
import { noop, type LogService } from 'common-services';
import {
  type WhookCommandHandler,
  type WhookCommandDefinition,
} from '../types/commands.js';

export const definition = {
  name: 'config',
  description: 'A simple program that returns the queryed config value',
  example: `whook config --name MYSQL --query 'auth.username' --default root`,
  arguments: [
    {
      name: 'name',
      required: true,
      description: 'Configuration name',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'query',
      description: 'Property to pickup in config (uses `miniquery`)',
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

async function initConfigCommand({
  APP_CONFIG,
  log = noop,
}: {
  APP_CONFIG: AppConfig;
  log?: LogService;
}): Promise<
  WhookCommandHandler<{
    name: string;
    query?: string;
    default?: string;
    pretty?: boolean;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name, query, default: defaultValue, pretty },
    } = args;

    if ('undefined' === typeof APP_CONFIG[name]) {
      log('error', `No config found for "${name}"`);
      if ('undefined' === typeof defaultValue) {
        throw new YError('E_NO_CONFIG', name);
      }
      log('info', `${JSON.stringify(defaultValue, null, pretty ? 2 : 0)}`);
      return;
    }

    const results = query
      ? miniquery(query, [APP_CONFIG[name]])
      : [APP_CONFIG[name]];

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

export default location(autoService(initConfigCommand), import.meta.url);
