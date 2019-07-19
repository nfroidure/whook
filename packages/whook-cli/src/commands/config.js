import { extra, autoService } from 'knifecycle';
import { readArgs } from '../libs/args';
import YError from 'yerror';
import miniquery from 'miniquery';

export const definition = {
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
    },
  },
};

export default extra(definition, autoService(initConfigCommand));

async function initConfigCommand({ CONFIGS, log, promptArgs }) {
  return async () => {
    const { name, query, default: defaultValue } = readArgs(
      definition.arguments,
      await promptArgs(),
    );

    if ('undefined' === typeof CONFIGS[name]) {
      log('error', `No config found for ${name}`);
      if ('undefined' === typeof defaultValue) {
        throw new YError('E_NO_CONFIG', name);
      }
    }

    const results = query ? miniquery(query, [CONFIGS[name]]) : [CONFIGS[name]];

    if (!results.length) {
      log('error', `Could not find any results for ${query}`);
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
      `${JSON.stringify(results.length ? results[0] : defaultValue)}`,
    );
  };
}
