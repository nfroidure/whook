import { extra, autoService } from 'knifecycle';
import { readArgs, identity } from '@whook/whook';
import { getOpenAPIOperations } from '@whook/http-router';
import { YError } from 'yerror';
import { exec } from 'child_process';
import crypto from 'crypto';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookConfig,
  WhookAPIHandlerDefinition,
} from '@whook/whook';
import type { ExecException } from 'child_process';
import type { LogService } from 'common-services';
import type { AppEnvVars } from 'application-services';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { WhookAWSLambdaBaseCronConfiguration } from '../config/common/config.js';

export const definition: WhookCommandDefinition = {
  description: 'A command printing lambdas informations for Terraform',
  example: `whook terraformValues --type paths`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['type'],
    properties: {
      type: {
        description: 'Type of values to return',
        type: 'string',
        enum: ['globals', 'envvars', 'paths', 'lambdas', 'lambda', 'schedules'],
      },
      pretty: {
        description: 'Pretty print JSON values',
        type: 'boolean',
      },
      lambdaName: {
        description: 'Name of the lambda',
        type: 'string',
      },
      pathsIndex: {
        description: 'Index of the paths to retrieve',
        type: 'number',
      },
      lambdaType: {
        description: 'Types of the lambdas to return',
        type: 'string',
      },
    },
  },
};

export default extra(definition, autoService(initTerraformValuesCommand));

async function initTerraformValuesCommand({
  API,
  CONFIG,
  BASE_PATH,
  ENV,
  PROXYED_ENV_VARS,
  log,
  args,
  execAsync = _execAsync,
}: {
  API: OpenAPIV3_1.Document;
  CONFIG: WhookConfig;
  BASE_PATH: string;
  ENV: AppEnvVars;
  PROXYED_ENV_VARS: string[];
  log: LogService;
  args: WhookCommandArgs;
  execAsync: typeof _execAsync;
}) {
  return async (): Promise<void> => {
    const {
      namedArguments: { type, pretty, lambdaName, pathsIndex, lambdaType },
    } = readArgs<{
      type: string;
      pretty: boolean;
      lambdaName: string;
      pathsIndex: number;
      lambdaType: string;
    }>(definition.arguments, args);
    const allOperations =
      await getOpenAPIOperations<
        WhookAPIHandlerDefinition['operation']['x-whook']
      >(API);
    const configurations = allOperations.map((operation) => {
      const whookConfiguration =
        operation['x-whook'] ||
        ({
          type: 'http',
        } as WhookAPIHandlerDefinition['operation']['x-whook']);
      const configuration = {
        type: whookConfiguration?.type || 'http',
        timeout: (whookConfiguration?.timeout || 10).toString(),
        memory: (whookConfiguration?.memory || 128).toString(),
        contentHandling: 'CONVERT_TO_TEXT',
        description: operation.summary || '',
        enabled: whookConfiguration?.disabled ? 'false' : 'true',
        operationId: operation.operationId,
        sourceOperationId: operation.operationId,
        suffix: whookConfiguration?.suffix || '',
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
        schedules: (
          (whookConfiguration as WhookAWSLambdaBaseCronConfiguration)
            .schedules || []
        ).map(({ rule, body, enabled }) => ({
          rule: fixAWSSchedule(rule),
          body,
          enabled,
        })),
      };
      const qualifiedOperationId =
        (configuration.sourceOperationId || operation.operationId) +
        (configuration.suffix || '');

      return {
        qualifiedOperationId,
        method: operation.method.toUpperCase(),
        path: BASE_PATH + operation.path,
        resourceName: buildPartName(
          (BASE_PATH + operation.path).split('/').filter(identity),
        ),
        ...configuration,
      };
    });

    if (type === 'globals') {
      const commitHash = await execAsync(`git rev-parse HEAD`);
      const commitMessage = (
        await execAsync(`git rev-list --format=%B --max-count=1 HEAD`)
      ).split('\n')[1];
      const openapi = JSON.stringify(
        {
          ...API,
          servers: [],
          paths: configurations
            .filter(({ type }) => !type || type === 'http')
            .reduce((currentPaths, configuration) => {
              return {
                ...currentPaths,
                [configuration.path]: {
                  ...(currentPaths[configuration.path] || {}),
                  [configuration.method.toLowerCase()]: {
                    ...((API.paths?.[configuration.path] || {})[
                      configuration.method.toLowerCase()
                    ] || {}),
                    operationId: configuration.qualifiedOperationId,
                    responses: {},
                    ['x-amazon-apigateway-integration']: {
                      uri: `\${${configuration.qualifiedOperationId}}`,
                      httpMethod: 'POST',
                      contentHandling: configuration.contentHandling,
                      timeoutInMillis:
                        parseInt(configuration.timeout, 10) * 1000,
                      type: 'aws_proxy',
                    },
                  },
                },
              };
            }, {}),
        },
        null,
        pretty ? 2 : 0,
      );

      const openapiHash = crypto
        .createHash('md5')
        .update(JSON.stringify(API))
        .digest('hex');
      const infos = {
        apiDomain: new URL(CONFIG.baseURL || '').hostname,
        commitHash,
        commitMessage,
        openapi,
        openapiHash,
      };
      log('info', JSON.stringify(infos, null, pretty ? 2 : 0));
      return;
    }

    if (type === 'envvars') {
      const env = PROXYED_ENV_VARS.reduce(
        (finalEnv, key) => ({ ...finalEnv, [key]: ENV[key] }),
        {},
      );
      log('info', JSON.stringify(env, null, pretty ? 2 : 0));
      return;
    }

    if (type === 'lambdas') {
      const lambdas = configurations
        .filter((configuration) =>
          lambdaType ? configuration.type === lambdaType : true,
        )
        .reduce(
          (accLambdas, configuration) => ({
            ...accLambdas,
            [configuration.qualifiedOperationId]:
              configuration.resourceName +
              '|' +
              (configuration.path.split('/').filter(identity).length - 1) +
              '|' +
              configuration.timeout +
              '|' +
              configuration.memory,
          }),
          {},
        );

      log('info', JSON.stringify(lambdas, null, pretty ? 2 : 0));
      return;
    }

    if (type === 'paths') {
      if (typeof pathsIndex !== 'number') {
        throw new YError('E_PATHS_INDEX_REQUIRED');
      }
      const allPathParts = configurations.reduce(
        (accAllPathParts, configuration) => {
          const parts = configuration.path.split('/').filter(identity);

          return parts.reduce((accPathParts, part, index) => {
            const partName = buildPartName(parts.slice(0, index + 1));
            const parentName =
              0 < index ? buildPartName(parts.slice(0, index)) : '__root';

            return [
              ...accPathParts,
              {
                partName,
                parentName,
                part,
                index,
              },
            ];
          }, accAllPathParts);
        },
        [] as {
          partName: string;
          parentName: string;
          part: string;
          index: number;
        }[],
      );
      const allPathPartsForIndex = (allPathParts || [])
        .filter(({ index }) => pathsIndex === index)
        .reduce(
          (accAllPathPartsForIndex, { partName, parentName, part }) => ({
            ...accAllPathPartsForIndex,
            [partName]: parentName + '|' + part,
          }),
          {},
        );

      log('info', JSON.stringify(allPathPartsForIndex, null, pretty ? 2 : 0));
      return;
    }

    if (type === 'schedules') {
      const schedules = configurations
        .filter((configuration) => configuration.type === 'cron')
        .reduce((accSchedules, configuration) => {
          let scheduleIndex = 0;

          return {
            ...accSchedules,
            ...configuration.schedules.reduce(
              (accOpSchedules, schedule) => ({
                ...accOpSchedules,
                [`${
                  configuration.qualifiedOperationId
                }schedule${scheduleIndex++}`]:
                  configuration.qualifiedOperationId +
                  '|' +
                  schedule.rule +
                  '|' +
                  schedule.enabled +
                  '|' +
                  JSON.stringify(schedule.body || {}),
              }),
              {},
            ),
          };
        }, {});

      log('info', `${JSON.stringify(schedules, null, pretty ? 2 : 0)}`);
      return;
    }

    if (!lambdaName) {
      throw new YError('E_LAMBDA_NAME_REQUIRED');
    }

    const lambdaConfiguration = configurations.find(
      ({ qualifiedOperationId }) => qualifiedOperationId === lambdaName,
    );

    log(
      'info',
      `${JSON.stringify(
        {
          ...lambdaConfiguration,
          schedules: undefined,
        },
        null,
        pretty ? 2 : 0,
      )}`,
    );
  };
}

function buildPartName(parts: string[]): string {
  return parts
    .map((aPart, anIndex) => {
      const realPartName = aPart.replace(/[{}]/g, '');

      return anIndex
        ? realPartName[0].toUpperCase() + realPartName.slice(1)
        : realPartName;
    })
    .join('');
}

function fixAWSSchedule(schedule: string): string {
  if (typeof schedule === 'undefined') {
    return '';
  }

  // The last wildcard is for years.
  // This is a non-standard AWS addition...
  // Also, we have to put a `?` in either
  // day(month) or day(week) to fit AWS
  // way of building cron tabs...
  const fields = schedule.split(' ');

  if ('*' === fields[4]) {
    fields[4] = '?';
  } else if ('*' === fields[2]) {
    fields[2] = '?';
  } else {
    throw new YError('E_BAD_AWS_SCHEDULE', schedule);
  }
  return `cron(${fields.concat('*').join(' ')})`;
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
