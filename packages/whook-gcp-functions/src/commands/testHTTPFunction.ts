import { getOpenAPIDefinitions, loadFunction } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import { YError } from 'yerror';
import stream from 'node:stream';
import {
  DEFAULT_COMPILER_OPTIONS,
  PATH_SEPARATOR,
  SEARCH_SEPARATOR,
  readArgs,
  type WhookAPIHandlerParameters,
  type WhookOpenAPI,
  type WhookCommandArgs,
  type WhookCommandDefinition,
  type WhookCompilerOptions,
} from '@whook/whook';
import { type LogService } from 'common-services';

export const definition: WhookCommandDefinition = {
  description: 'A command for testing GCP HTTP function',
  example: `whook testHTTPFunction --name getPing`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Name of the function to run',
        type: 'string',
      },
      type: {
        description: 'Type of function to test',
        type: 'string',
        enum: ['main', 'index'],
        default: 'index',
      },
      contentType: {
        description: 'Content type of the payload',
        type: 'string',
        default: 'application/json',
      },
      parameters: {
        description: 'The HTTP call parameters',
        type: 'string',
        default: '{}',
      },
    },
  },
};

export default extra(definition, autoService(initTestHTTPFunctionCommand));

async function initTestHTTPFunctionCommand({
  APP_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  API,
  log,
  args,
}: {
  APP_ENV: string;
  PROJECT_DIR: string;
  COMPILER_OPTIONS?: WhookCompilerOptions;
  API: WhookOpenAPI;
  log: LogService;
  args: WhookCommandArgs;
}) {
  return async () => {
    const {
      namedArguments: { name, type, contentType, parameters: rawParameters },
    } = readArgs<{
      name: string;
      type: string;
      contentType: string;
      parameters: string;
    }>(definition.arguments, args);
    const extension = COMPILER_OPTIONS.format === 'cjs' ? '.cjs' : '.mjs';
    const handler = await loadFunction(
      { APP_ENV, PROJECT_DIR, log },
      name,
      type,
      extension,
    );
    const handlerDefinition = getOpenAPIDefinitions(API).find(
      ({ operation }) => operation.operationId === name,
    );

    if (!handlerDefinition) {
      throw new YError('E_OPERATION_NOT_FOUND');
    }

    const hasBody = !!handlerDefinition.operation.requestBody;
    const parameters = JSON.parse(rawParameters) as WhookAPIHandlerParameters;
    const search = Object.keys(parameters.query || {}).reduce((accSearch, name) => {
      if (null != parameters.query[name]) {
        return (
          accSearch +
          (accSearch ? '&' : '') +
          name +
          '=' +
          parameters.query[name]
        );
      }
      return accSearch;
    }, '');

    const path = handlerDefinition.path
      .split(PATH_SEPARATOR)
      .map((part) => {
        const matches = /^\{([\d\w]+)\}$/i.exec(part);

        if (matches) {
          return parameters.path?.[matches[1]];
        }
        return part;
      })
      .join(PATH_SEPARATOR);
    const gcpfRequest = {
      method: handlerDefinition.method,
      originalUrl: path + (search ? SEARCH_SEPARATOR + search : ''),
      headers: parameters.header || {},
      rawBody: Buffer.from(
        hasBody
          ? contentType === 'application/json'
            ? parameters.body
              ? JSON.stringify(parameters.body)
              : ''
            : (parameters.body as string) || ''
          : '',
      ),
    };
    if (hasBody) {
      gcpfRequest.headers['content-type'] = `${contentType};charset=UTF-8`;
    }
    log('info', 'GCPF_REQUEST:', gcpfRequest as unknown as string);

    const response = {
      status: 0,
      headers: {},
      data: '',
    };
    await new Promise<void>((resolve, reject) => {
      const gcpfResponse = new stream.PassThrough();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gcpfResponse as any).set = (name: string, value: string): void => {
        response.headers[name] = value;
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gcpfResponse as any).status = (code: number): void => {
        response.status = code;
      };

      handler(gcpfRequest, gcpfResponse).catch(reject);

      const chunks = [] as Buffer[];

      gcpfResponse.once('end', () => {
        response.data = Buffer.concat(chunks).toString();
        resolve();
      });
      gcpfResponse.once('error', reject);
      gcpfResponse.on('readable', () => {
        let data: Buffer;
        while ((data = gcpfResponse.read())) {
          chunks.push(data);
        }
      });
    });
    log('info', 'SUCCESS:', response);
  };
}
