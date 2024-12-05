/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBuildAutoload, noop, cleanupOpenAPI } from '@whook/whook';
import {
  Knifecycle,
  wrapInitializer,
  constant,
  alsoInject,
  location,
} from 'knifecycle';
import { YError } from 'yerror';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import initHandler from './HANDLER.js';
import initWrapHandlerForAWSConsumerLambda from '../wrappers/awsConsumerLambda.js';
import initWrapHandlerForAWSHTTPLambda from '../wrappers/awsHTTPLambda.js';
import initWrapHandlerForAWSLogSubscriberLambda from '../wrappers/awsLogSubscriberLambda.js';
import initWrapHandlerForAWSTransformerLambda from '../wrappers/awsTransformerLambda.js';
import initWrapHandlerForAWSCronLambda from '../wrappers/awsCronLambda.js';
import initWrapHandlerForAWSKafkaConsumerLambda from '../wrappers/awsKafkaConsumerLambda.js';
import initWrapHandlerForAWSS3Lambda from '../wrappers/awsS3Lambda.js';
import type { WhookBuildConstantsService } from '@whook/whook';
import type { WhookRawOperation } from '@whook/http-router';
import type {
  Injector,
  Autoloader,
  Initializer,
  Dependencies,
  Service,
  ServiceInitializerWrapper,
} from 'knifecycle';
import type { LogService } from 'common-services';
import type { OpenAPIV3_1 } from 'openapi-types';
import type {
  WhookAPIOperationAWSLambdaConfig,
  WhookAWSLambdaConfiguration,
} from '../index.js';

export type WhookAWSLambdaAutoloadDependencies = {
  BUILD_CONSTANTS?: WhookBuildConstantsService;
  $injector: Injector<Service>;
  $instance: Knifecycle;
  log?: LogService;
};

export const AWS_WRAPPERS: Record<
  WhookAWSLambdaConfiguration['type'],
  {
    name: string;
    initializer: Initializer<Service, Dependencies>;
  }
> = {
  consumer: {
    name: 'awsConsumerLambda',
    initializer: initWrapHandlerForAWSConsumerLambda as any,
  },
  http: {
    name: 'awsHTTPLambda',
    initializer: initWrapHandlerForAWSHTTPLambda as any,
  },
  log: {
    name: 'awsLogSubscriberLambda',
    initializer: initWrapHandlerForAWSLogSubscriberLambda as any,
  },
  transformer: {
    name: 'awsTransformerLambda',
    initializer: initWrapHandlerForAWSTransformerLambda as any,
  },
  cron: {
    name: 'awsCronLambda',
    initializer: initWrapHandlerForAWSCronLambda as any,
  },
  kafka: {
    name: 'awsKafkaConsumerLambda',
    initializer: initWrapHandlerForAWSKafkaConsumerLambda as any,
  },
  s3: {
    name: 'awsS3Lambda',
    initializer: initWrapHandlerForAWSS3Lambda as any,
  },
};

const initializerWrapper: ServiceInitializerWrapper<
  Autoloader<Initializer<Dependencies, Service>>,
  Dependencies
> = (async (
  {
    $injector,
    log = noop,
  }: WhookAWSLambdaAutoloadDependencies,
  $autoload: Autoloader<Initializer<Dependencies, Service>>,
): Promise<
  (serviceName: string) => Promise<Initializer<Dependencies, Service>>
> => {
  let API: OpenAPIV3_1.Document;
  let OPERATION_APIS: WhookRawOperation<WhookAPIOperationAWSLambdaConfig>[];
  const getAPIOperation: (
    serviceName: string,
  ) => Promise<
    [WhookAWSLambdaConfiguration['type'], string, OpenAPIV3_1.Document]
  > = (() => {
    return async (serviceName) => {
      const cleanedName = serviceName.split('_').pop();

      API = API || (await $injector(['API'])).API;

      OPERATION_APIS =
        OPERATION_APIS ||
        getOpenAPIOperations<WhookAPIOperationAWSLambdaConfig>(API);

      const OPERATION = OPERATION_APIS.find(
        (operation) =>
          cleanedName ===
          (((operation['x-whook'] || {}).sourceOperationId &&
            (operation['x-whook'] || {}).sourceOperationId) ||
            operation.operationId) +
            ((operation['x-whook'] || {}).suffix || ''),
      );

      if (!OPERATION) {
        log('error', '💥 - Unable to find a lambda operation definition!');
        throw new YError('E_OPERATION_NOT_FOUND', serviceName, cleanedName);
      }

      const OPERATION_API: OpenAPIV3_1.Document = cleanupOpenAPI({
        ...API,
        paths: {
          [OPERATION.path]: {
            [OPERATION.method]: API.paths?.[OPERATION.path]?.[OPERATION.method],
          },
        },
      });

      return [
        OPERATION['x-whook']?.type || 'http',
        OPERATION.operationId as string,
        {
          ...OPERATION_API,
          paths: {
            [OPERATION.path]: {
              [OPERATION.method]: (
                await dereferenceOpenAPIOperations(OPERATION_API, [
                  {
                    path: OPERATION.path,
                    method: OPERATION.method,
                    ...OPERATION_API.paths?.[OPERATION.path]?.[
                      OPERATION.method
                    ],
                    parameters: OPERATION.parameters,
                  },
                ])
              )[0],
            },
          },
        },
      ];
    };
  })();

  log('debug', '🤖 - Initializing the `$autoload` build wrapper.');

  return async (serviceName) => {
    if (serviceName.startsWith('OPERATION_API_')) {
      const [, , OPERATION_API] = await getAPIOperation(serviceName);

      return constant(serviceName, OPERATION_API);
    }

    if (serviceName.startsWith('OPERATION_WRAPPER_')) {
      const [type] = await getAPIOperation(serviceName);

      return location(
        alsoInject(
          [
            `OPERATION_API>${serviceName.replace(
              'OPERATION_WRAPPER_',
              'OPERATION_API_',
            )}`,
          ],
          AWS_WRAPPERS[type].initializer as any,
        ) as any,
        `@whook/aws-lambda/dist/wrappers/${AWS_WRAPPERS[type].name}.js`,
      ) as any;
    }

    if (serviceName.startsWith('OPERATION_HANDLER_')) {
      const [type, operationId] = await getAPIOperation(serviceName);

      return location(
        alsoInject(
          [
            `mainWrapper>OPERATION_WRAPPER_${serviceName.replace(
              'OPERATION_HANDLER_',
              '',
            )}`,
            // Only inject wrappers for HTTP handlers and
            // eventually inject other ones
            ...(type !== 'http'
              ? [`?WRAPPERS>${type.toUpperCase()}_WRAPPERS`]
              : []),
            `baseHandler>${operationId}`,
          ],
          initHandler,
        ) as any,
        '@whook/aws-lambda/dist/services/HANDLER.js',
      );
    }

    return await $autoload(serviceName);
  };
}) as any;

/**
 * Wrap the _autoload service in order to build for AWS
 *  Lambda compatible code.
 * @param  {Object}   services
 * The services the autoloader depends on
 * @param  {Object}   [services.BUILD_CONSTANTS]
 * The injected BUILD_CONSTANTS value to add it to the build env
 * @param  {Object}   $instance
 * A Knifecycle instance
 * @param  {Object}   $injector
 * The Knifecycle injector
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export default alsoInject(
  ['?BUILD_CONSTANTS', '$instance', '$injector', '?log'],
  wrapInitializer(initializerWrapper as any, initBuildAutoload),
);
