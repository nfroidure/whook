import { extra, autoService } from 'knifecycle';
import { readArgs, WhookAPIHandlerConfig } from '@whook/whook';
import { YError } from 'yerror';
import { exec } from 'child_process';
import crypto from 'crypto';
import yaml from 'js-yaml';
import { type ExecException } from 'child_process';
import { type LogService } from 'common-services';
import {
  type WhookCommandArgs,
  type WhookCommandDefinition,
  type WhookAPIHandlerDefinition,
  type WhookOpenAPI,
} from '@whook/whook';
import { pathItemToOperationMap } from 'ya-open-api-types';

export const definition: WhookCommandDefinition = {
  description: 'A command printing functions informations for Terraform',
  example: `whook terraformValues --type paths`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['type'],
    properties: {
      type: {
        description: 'Type of values to return',
        type: 'string',
        enum: ['globals', 'paths', 'functions', 'function'],
      },
      pretty: {
        description: 'Pretty print JSON values',
        type: 'boolean',
      },
      functionName: {
        description: 'Name of the function',
        type: 'string',
      },
      pathsIndex: {
        description: 'Index of the paths to retrieve',
        type: 'number',
      },
      functionType: {
        description: 'Types of the functions to return',
        type: 'string',
      },
    },
  },
};

export default extra(definition, autoService(initTerraformValuesCommand));

async function initTerraformValuesCommand({
  API,
  BASE_PATH,
  log,
  args,
  execAsync = _execAsync,
}: {
  API: WhookOpenAPI;
  BASE_PATH: string;
  log: LogService;
  args: WhookCommandArgs;
  execAsync: typeof _execAsync;
}) {
  return async () => {
    const {
      namedArguments: { type, pretty, functionName, functionType },
    } = readArgs<{
      type: string;
      pretty: boolean;
      functionName: string;
      functionType: string;
    }>(definition.arguments, args);
    const definitions: WhookAPIHandlerDefinition[] = [];

    for (const [path, pathItem] of Object.entries(API.paths || {})) {
      for (const [method, operation] of Object.entries(
        pathItemToOperationMap(pathItem || {}),
      )) {
        definitions.push({
          path,
          method,
          operation,
          config: { type: 'http', ...((operation['x-whook'] as object) || {}) },
        } as unknown as WhookAPIHandlerDefinition);
      }
    }

    const configurations = definitions.map((definition) => {
      const whookConfiguration = (definition.config || {
        type: 'http',
      }) as WhookAPIHandlerConfig;
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
                  WhookAPIHandlerDefinition['operation']['x-whook']
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
