/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadLambda } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import { DEFAULT_COMPILER_OPTIONS, noop, readArgs } from '@whook/whook';
import { YError } from 'yerror';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import { v4 as randomUUID } from 'uuid';
import camelCase from 'camelcase';
import { extractOperationSecurityParameters } from '@whook/http-router';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookCompilerOptions,
} from '@whook/whook';
import type { AppEnvVars } from 'application-services';
import type { LogService, TimeService } from 'common-services';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { WhookAPIOperationAWSLambdaConfig } from '../index.js';
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
        description: 'Name of the lambda to run',
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
  ENV,
  APP_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  API,
  time,
  log = noop,
  args,
}: {
  ENV: AppEnvVars;
  APP_ENV: string;
  PROJECT_DIR: string;
  COMPILER_OPTIONS?: WhookCompilerOptions;
  API: OpenAPIV3_1.Document;
  time: TimeService;
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
    const handler = await loadLambda(
      { APP_ENV, PROJECT_DIR, log },
      name,
      type,
      extension,
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
          headerParameters[p.name] =
            parameters[camelCase(p.name)] instanceof Array
              ? parameters[camelCase(p.name)][0]
              : parameters[camelCase(p.name)];
          return headerParameters;
        }, {}),
      multiValueHeaders: ammendedParameters
        .filter((p) => p.in === 'header')
        .reduce((headerParameters, p) => {
          headerParameters[p.name] =
            parameters[camelCase(p.name)] instanceof Array
              ? parameters[camelCase(p.name)]
              : [parameters[camelCase(p.name)]];
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
        stage: ENV.NODE_ENV,
        requestTimeEpoch: time(),
        requestId: randomUUID(),
        httpMethod: OPERATION.method.toUpperCase(),
      },
    } as APIGatewayProxyEvent;
    if (hasBody) {
      awsRequest.headers['content-type'] = `${contentType};charset=UTF-8`;
    }
    log('info', 'AWS_REQUEST:', awsRequest as unknown as string);

    const result: APIGatewayProxyResult = await handler(awsRequest);

    log('info', 'SUCCESS:', result as unknown as string);

    process.emit('SIGTERM');
  };
}
