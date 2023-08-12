import initGetOpenAPI from '../handlers/getOpenAPI.js';
import { readArgs } from '../libs/args.js';
import { autoService, extra } from 'knifecycle';
import type { LogService } from 'common-services';
import type { WhookCommandArgs } from '../services/args.js';
import type { WhookCommandDefinition } from '../services/promptArgs.js';

/* Architecture Note #5.3.2: Open API generator

Here, we reuse the Open API handler to generate the
 definition of the API right inside a CLI command.
*/

export const definition: WhookCommandDefinition = {
  description: 'Write openAPI schema to stdout',
  example: `whook generateOpenAPISchema`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: [],
    properties: {
      pretty: {
        description: 'Option to prettify output',
        type: 'boolean',
        default: true,
      },
      authenticated: {
        description: 'Option to get the private routes too',
        type: 'boolean',
        default: true,
      },
    },
  },
};

export default extra(definition, autoService(initGenerateOpenAPISchema));

/* Architecture Note #5.2.1: Injecting handlers
  
  A good thing is that you can reuse any handler into
   your commands by simply injecting it by name.
  */
async function initGenerateOpenAPISchema({
  getOpenAPI,
  outstream = process.stdout,
  args,
  log,
}: {
  getOpenAPI: Awaited<ReturnType<typeof initGetOpenAPI>>;
  outstream: NodeJS.WritableStream;
  args: WhookCommandArgs;
  log: LogService;
}): Promise<() => Promise<void>> {
  return async function generateOpenAPISchema() {
    const {
      namedArguments: { pretty, authenticated },
    } = readArgs<{
      pretty: boolean;
      authenticated: boolean;
    }>(definition.arguments, args);

    log('warning', '📥 - Retrieving schema...');
    const response = await getOpenAPI({
      authenticated,
      mutedMethods: ['options'],
      mutedParameters: [],
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
