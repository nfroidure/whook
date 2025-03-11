/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Knifecycle,
  wrapInitializer,
  constant,
  alsoInject,
  location,
  type Injector,
  type Autoloader,
  type Initializer,
  type Dependencies,
  type Service,
  type ServiceInitializerWrapper,
} from 'knifecycle';
import { YError } from 'yerror';
import {
  initBuildAutoload,
  noop,
  initMainHandler,
  type WhookOpenAPI,
  type WhookBuildConstantsService,
  type WhookRoutesDefinitionsService,
  type WhookCronsDefinitionsService,
  type WhookCronDefinition,
} from '@whook/whook';
import initWrapHandlerForAWSConsumerLambda from '../wrappers/awsConsumerLambda.js';
import initWrapHandlerForAWSHTTPLambda from '../wrappers/awsHTTPLambda.js';
import initWrapHandlerForAWSLogSubscriberLambda from '../wrappers/awsLogSubscriberLambda.js';
import initWrapHandlerForAWSTransformerLambda from '../wrappers/awsTransformerLambda.js';
import initWrapHandlerForAWSCronLambda from '../wrappers/awsCronLambda.js';
import initWrapHandlerForAWSKafkaConsumerLambda from '../wrappers/awsKafkaConsumerLambda.js';
import initWrapHandlerForAWSS3Lambda from '../wrappers/awsS3Lambda.js';
import { type LogService } from 'common-services';
import { cleanupOpenAPI } from 'ya-open-api-types';
import { type WhookAWSLambdaConfiguration } from '../index.js';

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
  { $injector, log = noop }: WhookAWSLambdaAutoloadDependencies,
  $autoload: Autoloader<Initializer<Dependencies, Service>>,
): Promise<
  (serviceName: string) => Promise<Initializer<Dependencies, Service>>
> => {
  let API: WhookOpenAPI;
  let ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  let CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  const getAPIDefinition: (
    serviceName: string,
  ) => Promise<
    [
      WhookAWSLambdaConfiguration['type'],
      string,
      WhookOpenAPI | WhookCronDefinition,
    ]
  > = (() => {
    return async (serviceName) => {
      const cleanedName = serviceName.split('_').pop() as string;

      API = API || (await $injector(['API'])).API;
      ROUTES_DEFINITIONS =
        ROUTES_DEFINITIONS ||
        (await $injector(['ROUTES_DEFINITIONS'])).ROUTES_DEFINITIONS;
      CRONS_DEFINITIONS =
        CRONS_DEFINITIONS ||
        (await $injector(['CRONS_DEFINITIONS'])).CRONS_DEFINITIONS;

      if (CRONS_DEFINITIONS[cleanedName]?.module?.definition) {
        return [
          'cron',
          cleanedName,
          CRONS_DEFINITIONS[cleanedName]?.module?.definition,
        ];
      } else if (ROUTES_DEFINITIONS[cleanedName]?.module?.definition) {
        const definition = ROUTES_DEFINITIONS[cleanedName]?.module?.definition;

        return [
          'http',
          cleanedName,
          (await cleanupOpenAPI({
            ...API,
            paths: {
              [definition.path]: {
                parameters: API?.paths?.[definition.path]?.parameters || [],
                [definition.method]:
                  API.paths?.[definition.path]?.[definition.method],
              },
            },
          })) as WhookOpenAPI,
        ];
      }

      log('error', '💥 - Unable to find a lambda operation definition!');
      throw new YError('E_OPERATION_NOT_FOUND', serviceName, cleanedName);
    };
  })();

  log('debug', '🤖 - Initializing the `$autoload` build wrapper.');

  return async (serviceName) => {
    if (serviceName.startsWith('OPERATION_API_')) {
      const [, , OPERATION_API] = await getAPIDefinition(serviceName);

      return constant(serviceName, OPERATION_API);
    }

    if (serviceName.startsWith('OPERATION_WRAPPER_')) {
      const [type] = await getAPIDefinition(serviceName);

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
      const [type, operationId] = await getAPIDefinition(serviceName);

      return location(
        alsoInject(
          [
            `MAIN_WRAPPER>OPERATION_WRAPPER_${serviceName.replace(
              'OPERATION_HANDLER_',
              '',
            )}`,
            // TODO: Review it
            // Only inject wrappers for HTTP routes and
            // eventually inject other ones
            ...(type !== 'http'
              ? [`?WRAPPERS>${type.toUpperCase()}_WRAPPERS`]
              : []),
            `BASE_HANDLER>${operationId}`,
          ],
          initMainHandler,
        ) as any,
        '@whook/whook/dist/services/MAIN_HANDLER.js',
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
