import { extra, autoService } from 'knifecycle';
import { LogService } from 'common-services';
import { ENVService, identity } from '@whook/whook';
import { readArgs, WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';
import { OpenAPIV3 } from 'openapi-types';
import { getOpenAPIOperations } from '@whook/http-router';
import YError from 'yerror';
import { exec } from 'child_process';
import crypto from 'crypto';

export type WhookAWSLambdaBaseBuildConfiguration = {
  private?: boolean;
  memory?: number;
  timeout?: number;
  suffix?: string;
  sourceOperationId?: string;
};
export type WhookAWSLambdaBaseHTTPConfiguration = {
  type: 'http';
} & WhookAWSLambdaBaseBuildConfiguration;
export type WhookAWSLambdaBaseCronConfiguration = {
  type: 'cron';
  enabled: boolean;
  schedule: string;
} & WhookAWSLambdaBaseBuildConfiguration;
export type WhookAWSLambdaBaseConsumerConfiguration = {
  type: 'consumer';
  enabled: boolean;
} & WhookAWSLambdaBaseBuildConfiguration;
export type WhookAWSLambdaBaseTransformerConfiguration = {
  type: 'transformer';
  enabled: boolean;
} & WhookAWSLambdaBaseBuildConfiguration;
export type WhookAWSLambdaBuildConfiguration =
  | WhookAWSLambdaBaseHTTPConfiguration
  | WhookAWSLambdaBaseCronConfiguration
  | WhookAWSLambdaBaseConsumerConfiguration
  | WhookAWSLambdaBaseTransformerConfiguration;

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
        enum: ['globals', 'paths', 'lambdas', 'lambda'],
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
    const { type, pretty, lambdaName, pathsIndex, lambdaType } = readArgs(
      definition.arguments,
      args,
    ) as {
      type: string;
      pretty: boolean;
      lambdaName: string;
      pathsIndex: number;
      lambdaType: string;
    };
    if (type === 'globals') {
      const commitHash = await execAsync(`git rev-parse HEAD`);
      const commitMessage = (
        await execAsync(`git rev-list --format=%B --max-count=1 HEAD`)
      ).split('\n')[1];
      const openapiHash = crypto
        .createHash('md5')
        .update(JSON.stringify(API))
        .digest('hex');
      const infos = {
        commitHash,
        commitMessage,
        openapiHash,
      };
      log('info', JSON.stringify(infos));
      return;
    }
    const configurations = getOpenAPIOperations(API).map(operation => {
      const whookConfiguration = (operation['x-whook'] || {
        type: 'http',
      }) as WhookAWSLambdaBuildConfiguration;
      const configuration = {
        type: 'http',
        timeout: '10',
        memory: '128',
        contentHandling: 'CONVERT_TO_TEXT',
        description: operation.summary || '',
        enabled: 'true',
        sourceOperationId: operation.operationId,
        suffix: '',
        ...Object.keys(whookConfiguration).reduce(
          (accConfigurations, key) => ({
            ...accConfigurations,
            [key]: whookConfiguration[key].toString(),
          }),
          {},
        ),
        schedule: fixAWSSchedule(
          (whookConfiguration as WhookAWSLambdaBaseCronConfiguration).schedule,
        ),
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

    if (type === 'lambdas') {
      const lambdas = configurations
        .filter(configuration =>
          lambdaType ? configuration.type === lambdaType : true,
        )
        .reduce(
          (accLambdas, configuration) => ({
            ...accLambdas,
            [configuration.qualifiedOperationId]:
              configuration.resourceName +
              '|' +
              (configuration.path.split('/').filter(identity).length - 1),
          }),
          {},
        );

      log('info', `${JSON.stringify(lambdas, null, pretty ? 2 : 0)}`);
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
        [],
      );
      const allPathPartsForIndex = allPathParts
        .filter(({ index }) => pathsIndex === index)
        .reduce(
          (accAllPathPartsForIndex, { partName, parentName, part }) => ({
            ...accAllPathPartsForIndex,
            [partName]: parentName + '|' + part,
          }),
          {},
        );

      log(
        'info',
        `${JSON.stringify(allPathPartsForIndex, null, pretty ? 2 : 0)}`,
      );
      return;
    }

    if (!lambdaName) {
      throw new YError('E_LAMBDA_NAME_REQUIRED');
    }

    const lambdaConfiguration = configurations.find(
      ({ qualifiedOperationId }) => qualifiedOperationId === lambdaName,
    );

    log('info', `${JSON.stringify(lambdaConfiguration, null, pretty ? 2 : 0)}`);
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
    exec(command, (err: Error, stdout: string, stderr: string) => {
      if (err) {
        reject(YError.wrap(err, 'E_EXEC_FAILURE', stderr));
        return;
      }
      resolve(stdout.trim());
    });
  });
}
