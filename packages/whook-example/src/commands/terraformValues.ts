import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/whook';
import { flattenOpenAPI, getOpenAPIOperations } from '@whook/http-router';
import { YError } from 'yerror';
import { exec } from 'child_process';
import crypto from 'crypto';
import yaml from 'js-yaml';
import type { ExecException } from 'child_process';
import type { LogService } from 'common-services';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookAPIHandlerDefinition,
} from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';

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
  API: OpenAPIV3.Document;
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
    const operations = getOpenAPIOperations<
      WhookAPIHandlerDefinition['operation']['x-whook']
    >(await flattenOpenAPI(API));
    const configurations = operations.map((operation) => {
      const whookConfiguration = (operation['x-whook'] || {
        type: 'http',
      }) as WhookAPIHandlerDefinition['operation']['x-whook'];
      const configuration = {
        type: 'http',
        timeout: '10',
        memory: '128',
        description: operation.summary || '',
        enabled: 'true',
        sourceOperationId: operation.operationId,
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
        (configuration.sourceOperationId || operation.operationId) +
        (configuration.suffix || '');

      return {
        qualifiedOperationId,
        method: operation.method.toUpperCase(),
        path: operation.path,
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
          const operation = operations.find(
            ({ operationId }) =>
              operationId === configuration.sourceOperationId,
          );

          return {
            ...accPaths,
            [configuration.path]: {
              ...(accPaths[configuration.path] || {}),
              [configuration.method.toLowerCase()]: {
                summary: configuration.description || '',
                operationId: configuration.qualifiedOperationId,
                ...((operation?.parameters || []).length
                  ? {
                      parameters: (
                        operation?.parameters as OpenAPIV3.ParameterObject[]
                      ).map(({ in: theIn, name, required }) => ({
                        in: theIn,
                        name,
                        type: 'string',
                        required: required || false,
                      })),
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
