import { autoService, extra } from 'knifecycle';
import { generateOpenAPITypes as generateTypes, toSource } from 'schema2dts';
import type { LogService } from 'common-services';
import type { WhookCommandDefinition } from '@whook/cli';

export const definition: WhookCommandDefinition = {
  description: 'Write openAPI types to stdout',
  example: `whook generateOpenAPITypes`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: [],
    properties: {},
  },
};

export default extra(definition, autoService(initGenerateOpenAPITypes));

async function initGenerateOpenAPITypes({
  instream = process.stdin,
  outstream = process.stdout,
  log,
}: {
  instream: NodeJS.ReadableStream;
  outstream: NodeJS.WritableStream;
  log: LogService;
}): Promise<() => Promise<void>> {
  return async function generateOpenAPITypes() {
    log('warning', '📥 - Retrieving API schema...');

    const openAPI: string = await new Promise((resolve, reject) => {
      let buffer = Buffer.from('');
      instream.on('data', (aBuffer) => {
        buffer = Buffer.concat([buffer, aBuffer]);
      });
      instream.once('error', () => reject);
      instream.once('end', () => resolve(buffer.toString()));
    });

    const typesDefs = toSource(await generateTypes(JSON.parse(openAPI)));

    log('warning', '📇 - Writing types...');
    await new Promise((resolve, reject) => {
      outstream.once('finish', resolve);
      outstream.once('error', reject);
      outstream.write(typesDefs);
      outstream.end();
    });
  };
}
