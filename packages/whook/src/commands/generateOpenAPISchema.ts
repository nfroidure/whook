import initGetOpenAPI from '../routes/getOpenAPI.js';
import { autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  type WhookCommandHandler,
  type WhookCommandDefinition,
} from '../types/commands.js';

/* Architecture Note #2.9.2.3: Open API generator

Here, we reuse the Open API handler to generate the
 definition of the API right inside a CLI command.
*/

export const definition = {
  name: 'generateOpenAPISchema',
  description: 'Write openAPI schema to stdout',
  example: `whook generateOpenAPISchema`,
  arguments: [
    {
      name: 'pretty',
      description: 'Option to prettify output',
      schema: { type: 'boolean', default: true },
    },
    {
      name: 'authenticated',
      description: 'Option to get the private routes too',
      schema: { type: 'boolean', default: true },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initGenerateOpenAPISchema({
  getOpenAPI,
  outstream = process.stdout,
  log,
}: {
  getOpenAPI: Awaited<ReturnType<typeof initGetOpenAPI>>;
  outstream: NodeJS.WritableStream;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    pretty?: boolean;
    authenticated?: boolean;
  }>
> {
  return async function generateOpenAPISchema(args) {
    const {
      namedArguments: { pretty, authenticated },
    } = args;

    log('warning', '📥 - Retrieving schema...');
    const response = await getOpenAPI({
      options: { authenticated },
      query: {
        mutedMethods: ['options'],
        mutedParameters: [],
      },
    });
    log('warning', '📇 - Writing Open API schema...');

    await new Promise((resolve, reject) => {
      outstream.once('finish', resolve);
      outstream.once('error', reject);
      outstream.write(
        JSON.stringify(response.body, null, pretty ? 2 : undefined),
      );
      outstream.end();
    });
  };
}

export default autoService(initGenerateOpenAPISchema);
