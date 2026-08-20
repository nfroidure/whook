import {
  type WhookCommandDefinition,
  type WhookCommandHandler,
} from '@whook/whook';

import { type LogService, randomBytes as _randomBytes } from 'common-services';
import { autoService, location } from 'knifecycle';

const OUTPUT_TYPES = ['env', 'json'] as const;

export const definition = {
  name: `createSecretKey`,
  description: 'A command to create a secret key',
  example: `whook createSecretKey --name "MY_SECRET"`,
  arguments: [
    {
      name: 'output',
      description: 'Whether output as JSON or as ENV',
      schema: {
        type: 'string',
        enum: OUTPUT_TYPES.concat(),
        default: OUTPUT_TYPES[0],
      },
    },
    {
      name: 'name',
      description: 'Key name',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'size',
      description: 'Key size',
      schema: {
        type: 'number',
        default: 32,
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initCreateSecretKeyCommand({
  randomBytes = _randomBytes,
  log,
}: {
  randomBytes: typeof _randomBytes;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    output: (typeof OUTPUT_TYPES)[number];
    size: number;
    name: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { output, size, name },
    } = args;
    log('warning', `✔️ - Created a secret key (${name})`);

    const secret = (await randomBytes(size)).toString('hex');

    if (output === 'json') {
      log(
        'info',
        `${JSON.stringify(
          {
            secret,
          },
          null,
          2,
        )}`,
      );
    } else {
      log('info', `${name}=${secret}`);
    }
  };
}

export default location(
  autoService(initCreateSecretKeyCommand),
  import.meta.url,
);
