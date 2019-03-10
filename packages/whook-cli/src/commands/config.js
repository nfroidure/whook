import { extra, autoService } from 'knifecycle';
import { readArgs } from '../libs/args';
import YError from 'yerror';
import miniquery from 'miniquery';

const definition = {
  description: 'A simple program that returns the queryed config value',
  example: `whook config --name MYSQL --query 'auth.username' --default root`,
  arguments: {
    type: 'object',
    additionalProperies: false,
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

async function initConfigCommand({ CONFIGS, log, args }) {
  return async () => {
    readArgs(definition.arguments, args);

    if ('undefined' === typeof CONFIGS[args.name]) {
      log('error', `No config found for ${args.name}`);
      if ('undefined' === typeof args.default) {
        throw new YError('E_NO_CONFIG', args.name);
      }
    }

    const results = args.query
      ? miniquery(args.query, [CONFIGS[args.name]])
      : [CONFIGS[args.name]];

    if (!results.length) {
      log('error', `Could not find any results for ${args.query}`);
      if ('undefined' === typeof args.default) {
        throw new YError('E_NO_RESULT', args.name, args.query);
      }
    }

    if (results.length > 1) {
      log(
        'error',
        `Got ${results.length} results for the "${
          args.query
        }" query, picking-up the first one.`,
      );
    }

    log(
      'info',
      `${JSON.stringify(results.length ? results[0] : args.default)}`,
    );
  };
}
