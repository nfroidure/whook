import { loadLambda } from '../libs/utils';
import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli';
import YError from 'yerror';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import stream from 'stream';
import camelCase from 'camelcase';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookCommandNamedArgs,
} from '@whook/cli';
import type { LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';

const SEARCH_SEPARATOR = '?';
const PATH_SEPARATOR = '/';

export const definition: WhookCommandDefinition = {
  description: 'A command for testing AWS HTTP lambda',
  example: `whook testHTTPLambda --name getPing`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Name of the lamda to run',
        type: 'string',
      },
      type: {
        description: 'Type of lambda to test',
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

export default extra(definition, autoService(initTestHTTPLambdaCommand));

async function initTestHTTPLambdaCommand({
  NODE_ENV,
  PROJECT_DIR,
  API,
  log,
  args,
}: {
  NODE_ENV: string;
  PROJECT_DIR: string;
  API: OpenAPIV3.Document;
  log: LogService;
  args: WhookCommandArgs;
}) {
  return async () => {
    const {
      name,
      type,
      contentType,
      parameters: rawParameters,
    }: WhookCommandNamedArgs = readArgs(definition.arguments, args) as {
      name: string;
      type: string;
      contentType: string;
      parameters: string;
    };
    const handler = await loadLambda(
      { PROJECT_DIR, log },
      NODE_ENV,
      name,
      type,
    );
    const OPERATION = (
      await dereferenceOpenAPIOperations(API, getOpenAPIOperations(API))
    ).find(({ operationId }) => operationId === name);

    if (!OPERATION) {
      throw new YError('E_OPERATION_NOT_FOUND');
    }

    const hasBody = !!OPERATION.requestBody;
    const parameters = JSON.parse(rawParameters);
    const search = ((OPERATION.parameters || []) as OpenAPIV3.ParameterObject[])
      .filter((p) => p.in === 'query')
      .reduce((accSearch, p) => {
        if (null != parameters[p.name]) {
          return (
            accSearch +
            (accSearch ? '&' : '') +
            p.name +
            '=' +
            parameters[p.name]
          );
        }
        return accSearch;
      }, '');

    const path = OPERATION.path
      .split(PATH_SEPARATOR)

      .map((part) => {
        const matches = /^\{([\d\w]+)\}$/i.exec(part);

        if (matches) {
          return parameters[matches[1]];
        }
        return part;
      })
      .join(PATH_SEPARATOR);
    const gcpfRequest = {
      method: OPERATION.method,
      originalUrl: path + (search ? SEARCH_SEPARATOR + search : ''),
      headers: ((OPERATION.parameters || []) as OpenAPIV3.ParameterObject[])
        .filter((p) => p.in === 'header')
        .reduce((headerParameters, p) => {
          headerParameters[p.name] = parameters[camelCase(p.name)];
          return headerParameters;
        }, {}),
      rawBody: Buffer.from(
        hasBody
          ? contentType === 'application/json'
            ? parameters.body
              ? JSON.stringify(parameters.body)
              : ''
            : parameters.body || ''
          : '',
      ),
    };
    if (hasBody) {
      gcpfRequest.headers['content-type'] = `${contentType};charset=UTF-8`;
    }
    log('info', 'GCPF_REQUEST:', gcpfRequest);

    const response = {
      status: 0,
      headers: {},
      data: '',
    };
    await new Promise<void>((resolve, reject) => {
      const gcpfResponse: any = new stream.PassThrough();

      gcpfResponse.set = (name: string, value: string) => {
        response.headers[name] = value;
      };
      gcpfResponse.status = (code: number) => {
        response.status = code;
      };

      handler(gcpfRequest, gcpfResponse).catch(reject);

      const chunks = [];

      gcpfResponse.once('end', () => {
        response.data = Buffer.concat(chunks).toString();
        resolve();
      });
      gcpfResponse.once('error', reject);
      gcpfResponse.on('readable', () => {
        let data;
        while ((data = gcpfResponse.read())) {
          chunks.push(data);
        }
      });
    });
    log('info', 'SUCCESS:', response);
  };
}
