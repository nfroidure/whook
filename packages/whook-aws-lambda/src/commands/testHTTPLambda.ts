import { loadLambda } from '../libs/utils';
import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli';
import { noop } from '@whook/whook';
import YError from 'yerror';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import { v4 as randomUUID } from 'uuid';
import camelCase from 'camelcase';
import { extractOperationSecurityParameters } from '@whook/http-router';
import type { LogService, TimeService } from 'common-services';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookCommandNamedArgs,
} from '@whook/cli';
import type { OpenAPIV3 } from 'openapi-types';
import type { WhookAPIOperationAWSLambdaConfig } from '..';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

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
  time,
  log = noop,
  args,
}: {
  NODE_ENV: string;
  PROJECT_DIR: string;
  API: OpenAPIV3.Document;
  time: TimeService;
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
      await dereferenceOpenAPIOperations(
        API,
        getOpenAPIOperations<WhookAPIOperationAWSLambdaConfig>(API),
      )
    ).find(({ operationId }) => operationId === name);

    if (!OPERATION) {
      throw new YError('E_OPERATION_NOT_FOUND');
    }

    const ammendedParameters = extractOperationSecurityParameters(
      API,
      OPERATION,
    ).concat(OPERATION.parameters);
    const hasBody = !!OPERATION.requestBody;
    const parameters = JSON.parse(rawParameters);
    const awsRequest: APIGatewayProxyEvent = {
      pathParameters: ammendedParameters
        .filter((p) => p.in === 'path')
        .reduce((pathParameters, p) => {
          pathParameters[p.name] = '' + parameters[p.name];
          return pathParameters;
        }, {}),
      multiValueQueryStringParameters: ammendedParameters
        .filter((p) => p.in === 'query')
        .reduce((multiValueQueryStringParameters, p) => {
          multiValueQueryStringParameters[p.name] =
            null != parameters[p.name]
              ? parameters[p.name] instanceof Array
                ? parameters[p.name].map((val) => '' + val)
                : ['' + parameters[p.name]]
              : undefined;
          return multiValueQueryStringParameters;
        }, {}),
      headers: ammendedParameters
        .filter((p) => p.in === 'header')
        .reduce((headerParameters, p) => {
          headerParameters[p.name] = parameters[camelCase(p.name)];
          return headerParameters;
        }, {}),
      body: hasBody
        ? contentType === 'application/json'
          ? JSON.stringify(parameters.body)
          : parameters.body
        : '',
      requestContext: {
        path:
          '/v1' +
          OPERATION.path.replace(/:([a-zA-Z0-9]+)/gm, (_, name) => {
            return parameters[name];
          }),
        resourcePath: '/v1' + OPERATION.path,
        stage: NODE_ENV,
        requestTimeEpoch: time(),
        requestId: randomUUID(),
        httpMethod: OPERATION.method.toUpperCase(),
      },
    } as APIGatewayProxyEvent;
    if (hasBody) {
      awsRequest.headers['content-type'] = `${contentType};charset=UTF-8`;
    }
    log('info', 'AWS_REQUEST:', awsRequest);

    const result: APIGatewayProxyResult = await new Promise(
      (resolve, reject) => {
        const handlerPromise = handler(
          awsRequest,
          {
            succeed: (...args: unknown[]) => {
              handlerPromise.then(resolve.bind(null, ...args));
            },
            fail: reject,
          },
          (err: Error, ...args: unknown[]) => {
            if (err) {
              reject(err);
              return;
            }
            handlerPromise.then(resolve.bind(null, ...args));
          },
        ).catch(reject);
      },
    );
    log('info', 'SUCCESS:', result);
  };
}
