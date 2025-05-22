import { autoService, location } from 'knifecycle';
import { YError } from 'yerror';
import { exec } from 'child_process';
import crypto from 'crypto';
import {
  identity,
  type WhookCommandHandler,
  type WhookCommandDefinition,
  type WhookConfig,
  type WhookDefinitions,
  type WhookOpenAPI,
} from '@whook/whook';
import { type ExecException } from 'child_process';
import { type LogService } from 'common-services';
import { type AppEnvVars } from 'application-services';
import { type AppEnv } from '../index.js';

export type TerraformDefinition = {
  operationId: string;
  targetHandler?: string;
  contentHandling: string;
  method?: string;
  path?: string;
  resourceName: string;
  timeout: string;
  memory: string;
} & WhookDefinitions['configs'][string];

export const definition = {
  name: 'terraformValues',
  description: 'A command printing lambdas information for Terraform',
  example: `whook terraformValues --type paths`,
  arguments: [
    {
      name: 'type',
      description: 'Type of values to return',
      required: true,
      schema: {
        type: 'string',
        enum: ['globals', 'envvars', 'paths', 'lambdas', 'lambda', 'schedules'],
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
      name: 'lambdaName',
      description: 'Name of the lambda',
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
      name: 'lambdaType',
      description: 'Types of the lambdas to return',
      schema: {
        type: 'string',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initTerraformValuesCommand({
  APP_ENV,
  API,
  DEFINITIONS,
  CONFIG,
  BASE_PATH,
  ENV,
  PROXIED_ENV_VARS,
  log,
  execAsync = _execAsync,
}: {
  APP_ENV: AppEnv;
  API: WhookOpenAPI;
  DEFINITIONS: WhookDefinitions;
  CONFIG: WhookConfig;
  BASE_PATH: string;
  ENV: AppEnvVars;
  PROXIED_ENV_VARS: string[];
  log: LogService;
  execAsync: typeof _execAsync;
}): Promise<
  WhookCommandHandler<{
    type: string;
    pretty: boolean;
    lambdaName: string;
    pathsIndex: number;
    lambdaType: string;
  }>
> {
  return async (args): Promise<void> => {
    const {
      namedArguments: { type, pretty, lambdaName, pathsIndex, lambdaType },
    } = args;

    const definitions: TerraformDefinition[] = [];

    for (const handlerName of Object.keys(DEFINITIONS.configs)) {
      const baseDefinition = DEFINITIONS.configs[handlerName];

      if (baseDefinition.type === 'command') {
        continue;
      }

      const definition = {
        type: baseDefinition?.type || 'http',
        timeout: (baseDefinition.config?.timeout || 10).toString(),
        memory: (baseDefinition.config?.memory || 128).toString(),
        contentHandling: 'CONVERT_TO_TEXT',
        description:
          baseDefinition.type === 'route'
            ? baseDefinition.operation?.summary
            : '',
        enabled:
          baseDefinition.config?.environments &&
          baseDefinition.config?.environments !== 'all' &&
          !baseDefinition.config?.environments?.includes(APP_ENV)
            ? 'false'
            : 'true',
        operationId: handlerName,
        targetHandler: baseDefinition.config?.targetHandler,
        schedules: (baseDefinition.type === 'cron'
          ? baseDefinition.schedules
          : []
        ).map(({ rule, body, environments }) => ({
          rule: fixAWSSchedule(rule),
          body,
          enabled:
            typeof environments === 'undefined' ||
            environments === 'all' ||
            environments?.includes(APP_ENV),
        })),
      };

      definitions.push({
        ...baseDefinition,
        ...definition,
        operationId: handlerName,
        method:
          baseDefinition.type === 'route'
            ? baseDefinition.method.toUpperCase()
            : '',
        path:
          baseDefinition.type === 'route'
            ? BASE_PATH + baseDefinition.path
            : '',
        resourceName:
          baseDefinition.type === 'route'
            ? buildPartName(
                (BASE_PATH + baseDefinition.path).split('/').filter(identity),
              )
            : handlerName,
      } as unknown as TerraformDefinition);
    }

    if (type === 'globals') {
      const commitHash = await execAsync(`git rev-parse HEAD`);
      const commitMessage = (
        await execAsync(`git rev-list --format=%B --max-count=1 HEAD`)
      ).split('\n')[1];
      const openapi = JSON.stringify(
        {
          ...API,
          servers: [],
          paths: definitions
            .filter(({ type }) => !type || type === 'route')
            .reduce((currentPaths, configuration) => {
              return {
                ...currentPaths,
                [configuration.path as string]: {
                  ...(currentPaths[configuration.path as string] || {}),
                  [(configuration.method as string).toLowerCase()]: {
                    ...((API.paths?.[configuration.path as string] || {})[
                      (configuration.method as string).toLowerCase()
                    ] || {}),
                    operationId: configuration.operationId,
                    responses: {},
                    ['x-amazon-apigateway-integration']: {
                      uri: `\${${configuration.operationId}}`,
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
      const env = PROXIED_ENV_VARS.reduce(
        (finalEnv, key) => ({ ...finalEnv, [key]: ENV[key] }),
        {},
      );
      log('info', JSON.stringify(env, null, pretty ? 2 : 0));
      return;
    }

    if (type === 'lambdas') {
      const lambdas = definitions
        .filter((configuration) =>
          lambdaType ? configuration.type === lambdaType : true,
        )
        .reduce(
          (accLambdas, configuration) => ({
            ...accLambdas,
            [configuration.operationId]:
              configuration.resourceName +
              '|' +
              ((configuration.path as string).split('/').filter(identity)
                .length -
                1) +
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
      const allPathParts = definitions.reduce(
        (accAllPathParts, configuration) => {
          const parts = (configuration.path as string)
            .split('/')
            .filter(identity);

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
      const schedules = definitions
        .filter((configuration) => configuration.type === 'cron')
        .reduce((accSchedules, configuration) => {
          let scheduleIndex = 0;

          return {
            ...accSchedules,
            ...configuration.schedules.reduce(
              (accOpSchedules, schedule) => ({
                ...accOpSchedules,
                [`${configuration.operationId}schedule${scheduleIndex++}`]:
                  configuration.operationId +
                  '|' +
                  schedule.rule +
                  '|' +
                  (typeof schedule.environments === 'undefined' ||
                  schedule.environments === 'all' ||
                  schedule.environments?.includes(APP_ENV)
                    ? 'true'
                    : 'false') +
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

    const lambdaConfiguration = definitions.find(
      ({ operationId }) => operationId === lambdaName,
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

export function parseDayOfTheWeekToAWSCron(dayOfWeek: string): string {
  if (dayOfWeek.includes('-')) {
    return dayOfWeek
      .split('-')
      .map((day) => parseDayOfTheWeekToAWSCron(day))
      .join('-');
  }
  if (dayOfWeek.split(',').length > 1) {
    return dayOfWeek
      .split(',')
      .map((day) => parseDayOfTheWeekToAWSCron(day))
      .join(',');
  }
  if (isNaN(parseInt(dayOfWeek))) {
    return dayOfWeek;
  }

  return ((parseInt(dayOfWeek) % 7) + 1).toString();
}

export function fixAWSSchedule(schedule: string): string {
  if (typeof schedule === 'undefined') {
    return '';
  }
  // AWS cron expressions are different from standard cron expressions
  // see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-cron-expressions.html
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
    fields[4] = parseDayOfTheWeekToAWSCron(fields[4]);
  } else {
    throw new YError('E_BAD_AWS_SCHEDULE', schedule);
  }
  return `cron(${fields.concat('*').join(' ')})`;
}

export default location(
  autoService(initTerraformValuesCommand),
  import.meta.url,
);
