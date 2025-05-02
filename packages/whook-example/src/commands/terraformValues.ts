import { extra, autoService } from 'knifecycle';
import { YError } from 'yerror';
import { exec } from 'child_process';
import crypto from 'crypto';
import yaml from 'js-yaml';
import { type ExecException } from 'child_process';
import { type LogService } from 'common-services';
import {
  type WhookRouteDefinition,
  type WhookCommandDefinition,
  type WhookCommandHandler,
  type WhookOpenAPI,
  WhookRouteConfig,
} from '@whook/whook';
import { pathItemToOperationMap } from 'ya-open-api-types';

export const definition = {
  name: 'terraformValues',
  description: 'A command printing functions informations for Terraform',
  example: `whook terraformValues --type paths`,
  arguments: [
    {
      name: 'type',
      description: 'Type of values to return',
      schema: {
        type: 'string',
        enum: ['globals', 'paths', 'functions', 'function'],
      },
    },
    {
      name: 'pretty',
      description: 'Pretty print JSON values',
      schema: {
        type: 'boolean',
      },
    },
    {
      name: 'functionName',
      description: 'Name of the function',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'pathsIndex',
      description: 'Index of the paths to retrieve',
      schema: {
        type: 'number',
      },
    },
    {
      name: 'functionType',
      description: 'Types of the functions to return',
      schema: {
        type: 'string',
      },
    },
  ],
} as const as WhookCommandDefinition;

export default extra(definition, autoService(initTerraformValuesCommand));

async function initTerraformValuesCommand({
  API,
  BASE_PATH,
  log,
  execAsync = _execAsync,
}: {
  API: WhookOpenAPI;
  BASE_PATH: string;
  log: LogService;
  execAsync: typeof _execAsync;
}): Promise<
  WhookCommandHandler<{
    type: string;
    pretty: boolean;
    functionName: string;
    functionType: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { type, pretty, functionName, functionType },
    } = args;
    const definitions: WhookRouteDefinition[] = [];

    for (const [path, pathItem] of Object.entries(API.paths || {})) {
      for (const [method, operation] of Object.entries(
        pathItemToOperationMap(pathItem || {}),
      )) {
        definitions.push({
          path,
          method,
          operation,
          config: { type: 'http', ...((operation['x-whook'] as object) || {}) },
        } as unknown as WhookRouteDefinition);
      }
    }

    const configurations = definitions.map((definition) => {
      const whookConfiguration = (definition.config || {}) as WhookRouteConfig;
      const configuration = {
        type: 'http',
        timeout: '10',
        memory: '128',
        description: definition.operation.summary || '',
        enabled: 'true',
        sourceOperationId: definition.operation.operationId,
        suffix: '',
        ...Object.keys(whookConfiguration || {}).reduce(
          (accConfigurations, key) => ({
            ...accConfigurations,
            [key]: (
              (
                whookConfiguration as NonNullable<
                  WhookRouteDefinition['operation']['x-whook']
                >
              )[key] as string
            ).toString(),
          }),
          {},
        ),
      };
      const qualifiedOperationId =
        (configuration.sourceOperationId || definition.operation.operationId) +
        (configuration.suffix || '');

      return {
        qualifiedOperationId,
        method: definition.method.toUpperCase(),
        path: definition.path,
        ...configuration,
      };
    });

    if (type === 'globals') {
      const commitHash = await execAsync(`git rev-parse HEAD`);
      const commitMessage = (
        await execAsync(`git rev-list --format=%B --max-count=1 HEAD`)
      ).split('\n')[1];
      const openapi2 = yaml.safeDump({
        swagger: '2.0',
        info: {
          title: API.info.title,
          description: API.info.description,
          version: API.info.version,
        },
        host: '${infos_host}',
        basePath: BASE_PATH,
        schemes: ['https'],
        produces: ['application/json'],
        paths: configurations.reduce((accPaths, configuration) => {
          const definition = definitions.find(
            ({ operation }) =>
              operation.operationId === configuration.sourceOperationId,
          );

          return {
            ...accPaths,
            [configuration.path]: {
              ...(accPaths[configuration.path] || {}),
              [configuration.method.toLowerCase()]: {
                summary: configuration.description || '',
                operationId: configuration.qualifiedOperationId,
                ...((definition?.operation?.parameters || []).length
                  ? {
                      parameters:
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ((definition?.operation?.parameters || []) as any).map(
                          ({ in: theIn, name, required }) => ({
                            in: theIn,
                            name,
                            type: 'string',
                            required: required || false,
                          }),
                        ),
                    }
                  : undefined),
                'x-google-backend': {
                  address: `\${function_${configuration.qualifiedOperationId}}`,
                },
                responses: {
                  '200': { description: 'x', schema: { type: 'string' } },
                },
              },
            },
          };
        }, {}),
      });
      const openapiHash = crypto
        .createHash('md5')
        .update(JSON.stringify(API))
        .digest('hex');
      const infos = {
        commitHash,
        commitMessage,
        openapi2,
        openapiHash,
      };
      log('info', JSON.stringify(infos));
      return;
    }

    if (type === 'functions') {
      const functions = configurations
        .filter((configuration) =>
          functionType ? configuration.type === functionType : true,
        )
        .reduce(
          (accLambdas, configuration) => ({
            ...accLambdas,
            [configuration.qualifiedOperationId]:
              configuration.qualifiedOperationId,
          }),
          {},
        );

      log('info', `${JSON.stringify(functions, null, pretty ? 2 : 0)}`);
      return;
    }

    if (!functionName) {
      throw new YError('E_FUNCTION_NAME_REQUIRED');
    }

    const functionConfiguration = configurations.find(
      ({ qualifiedOperationId }) => qualifiedOperationId === functionName,
    );

    log(
      'info',
      `${JSON.stringify(functionConfiguration, null, pretty ? 2 : 0)}`,
    );
  };
}

async function _execAsync(command: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    exec(
      command,
      (err: ExecException | null, stdout: string, stderr: string) => {
        if (err) {
          reject(YError.wrap(err, 'E_EXEC_FAILURE', stderr));
          return;
        }
        resolve(stdout.trim());
      },
    );
  });
}
