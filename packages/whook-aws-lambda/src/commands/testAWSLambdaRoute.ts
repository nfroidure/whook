import { loadLambda } from '../libs/utils.js';
import { location, autoService } from 'knifecycle';
import { YError } from 'yerror';
import { v4 as randomUUID } from 'uuid';
import {
  DEFAULT_COMPILER_OPTIONS,
  noop,
  type WhookCommandHandler,
  type WhookCommandDefinition,
  type WhookCompilerOptions,
  type WhookRouteHandlerParameters,
  type WhookRoutesDefinitionsService,
} from '@whook/whook';
import { type AppEnvVars } from 'application-services';
import { type LogService, type TimeService } from 'common-services';
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
} from 'aws-lambda';

export const definition = {
  name: 'testAWSLambdaRoute',
  description: 'A command for testing AWS HTTP lambda',
  example: `whook testAWSLambdaRoute --name getPing`,
  arguments: [
    {
      name: 'name',
      required: true,
      description: 'Name of the lambda to run',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'type',
      description: 'Type of lambda to test',
      schema: {
        type: 'string',
        enum: ['main', 'index'],
        default: 'index',
      },
    },
    {
      name: 'contentType',
      description: 'Content type of the payload',
      schema: {
        type: 'string',
        default: 'application/json',
      },
    },
    {
      name: 'parameters',
      description: 'The HTTP call parameters',
      schema: {
        type: 'string',
        default: '{}',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initTestAWSLambdaRouteCommand({
  ENV,
  APP_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  ROUTES_DEFINITIONS,
  time,
  log = noop,
}: {
  ENV: AppEnvVars;
  APP_ENV: string;
  PROJECT_DIR: string;
  COMPILER_OPTIONS?: WhookCompilerOptions;
  ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  time: TimeService;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    name: string;
    type: string;
    contentType: string;
    parameters: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name, type, contentType, parameters: rawParameters },
    } = args;
    const extension = COMPILER_OPTIONS.format === 'cjs' ? '.cjs' : '.mjs';
    const handler = await loadLambda(
      { APP_ENV, PROJECT_DIR, log },
      name,
      type,
      extension,
    );
    const handlerDefinition = ROUTES_DEFINITIONS[name]?.module?.definition;

    if (!handlerDefinition) {
      throw new YError('E_OPERATION_NOT_FOUND');
    }

    const hasBody = !!handlerDefinition?.operation.requestBody;
    const parameters = JSON.parse(rawParameters) as WhookRouteHandlerParameters;
    const awsRequest: APIGatewayProxyEvent = {
      pathParameters: parameters.path || {},
      multiValueQueryStringParameters: parameters.query || {},
      headers: Object.keys(parameters.header || {}).reduce(
        (headers, name) => ({
          [name]:
            parameters.header[name] instanceof Array
              ? parameters.header[name][0]
              : parameters.header[name],
          ...headers,
        }),
        {},
      ),
      multiValueHeaders: Object.keys(parameters.header || {}).reduce(
        (headers, name) => ({
          [name]:
            parameters.header[name] instanceof Array
              ? parameters.header[name]
              : [parameters.header[name]],
          ...headers,
        }),
        {},
      ),
      body: hasBody
        ? contentType === 'application/json'
          ? JSON.stringify(parameters.body)
          : parameters.body
        : '',
      requestContext: {
        path:
          '/v1' +
          handlerDefinition.path.replace(/:([a-zA-Z0-9]+)/gm, (_, name) => {
            return parameters.path?.[name]?.toString() as string;
          }),
        resourcePath: '/v1' + handlerDefinition.path,
        stage: ENV.NODE_ENV,
        requestTimeEpoch: time(),
        requestId: randomUUID(),
        httpMethod: handlerDefinition.method.toUpperCase(),
      },
    } as APIGatewayProxyEvent;
    if (hasBody) {
      awsRequest.headers['content-type'] = `${contentType};charset=UTF-8`;
    }
    log('info', 'AWS_REQUEST:', awsRequest as unknown as string);

    const result: APIGatewayProxyResult = await handler(awsRequest, {});

    log('info', 'SUCCESS:', result as unknown as string);

    process.emit('SIGTERM');
  };
}

export default location(
  autoService(initTestAWSLambdaRouteCommand),
  import.meta.url,
);
