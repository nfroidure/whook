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
  type WhookCronsDefinitionsService,
  type WhookDefinitions,
  type WhookCronDefinition,
  type WhookRouteDefinition,
  type WhookRoutesDefinitionsService,
  type WhookConsumersDefinitionsService,
  type WhookConsumerDefinition,
  type WhookTransformerDefinition,
} from '@whook/whook';
import initWrapConsumerHandlerForAWSLambda from '../wrappers/wrapConsumerHandlerForAWSLambda.js';
import initWrapRouteHandlerForAWSLambda from '../wrappers/wrapRouteHandlerForAWSLambda.js';
import initWrapLogSubscriberHandlerForAWSLambda from '../wrappers/wrapLogSubscriberHandlerForAWSLambda.js';
import initWrapTransformerHandlerForAWSLambda from '../wrappers/wrapTransformerHandlerForAWSLambda.js';
import initWrapCronHandlerForAWSLambda from '../wrappers/wrapCronHandlerForAWSLambda.js';
import initWrapKafkaConsumerHandlerForAWSLambda from '../wrappers/wrapKafkaConsumerHandlerForAWSLambda.js';
import initWrapS3HandlerForAWSLambda from '../wrappers/wrapS3HandlerForAWSLambda.js';
import { type LogService } from 'common-services';
import { cleanupOpenAPI } from 'ya-open-api-types';

export type WhookAWSLambdaDefinition = {
  name: string;
} & (
  | {
      type: 'route';
      definition: WhookRouteDefinition;
      openAPI: WhookOpenAPI;
    }
  | {
      type: 'cron';
      definition: WhookCronDefinition;
    }
  | {
      type: 'consumer';
      definition: WhookConsumerDefinition;
    }
  | {
      type: 'transformer';
      definition: WhookTransformerDefinition;
    }
);

export type WhookAWSLambdaAutoloadDependencies = {
  BUILD_CONSTANTS?: WhookBuildConstantsService;
  $injector: Injector<Service>;
  $instance: Knifecycle;
  log?: LogService;
};

export const AWS_WRAPPERS = {
  route: {
    name: 'wrapRouteHandlerForAWSLambda',
    initializer: initWrapRouteHandlerForAWSLambda as any,
  },
  cron: {
    name: 'wrapCronHandlerForAWSLambda',
    initializer: initWrapCronHandlerForAWSLambda as any,
  },
  consumer: {
    name: 'wrapConsumerHandlerForAWSLambda',
    initializer: initWrapConsumerHandlerForAWSLambda as any,
  },
  log: {
    name: 'wrapLogSubscriberHandlerForAWSLambda',
    initializer: initWrapLogSubscriberHandlerForAWSLambda as any,
  },
  transformer: {
    name: 'wrapTransformerHandlerForAWSLambda',
    initializer: initWrapTransformerHandlerForAWSLambda as any,
  },
  kafka: {
    name: 'wrapKafkaConsumerHandlerForAWSLambda',
    initializer: initWrapKafkaConsumerHandlerForAWSLambda as any,
  },
  s3: {
    name: 'wrapS3HandlerForAWSLambda',
    initializer: initWrapS3HandlerForAWSLambda as any,
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
  let DEFINITIONS: WhookDefinitions;
  let CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  let CONSUMERS_DEFINITIONS: WhookConsumersDefinitionsService;
  let ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  const getDefinition = (() => {
    return async (serviceName: string): Promise<WhookAWSLambdaDefinition> => {
      const cleanedName = serviceName.split('_').pop() as string;

      API = API || (await $injector(['API'])).API;
      DEFINITIONS =
        DEFINITIONS || (await $injector(['DEFINITIONS'])).DEFINITIONS;

      const config = DEFINITIONS.configs[cleanedName as string];

      if (!config) {
        log('error', '💥 - Unable to find an AWS Lambda config!');
        throw new YError('E_OPERATION_NOT_FOUND', serviceName, cleanedName);
      }

      if (config.type === 'route') {
        ROUTES_DEFINITIONS =
          ROUTES_DEFINITIONS ||
          (await $injector(['ROUTES_DEFINITIONS'])).ROUTES_DEFINITIONS;

        const openAPI = (await cleanupOpenAPI({
          ...API,
          paths: {
            [config.path]: {
              parameters: API?.paths?.[config.path]?.parameters || [],
              [config.method]: API.paths?.[config.path]?.[config.method],
            },
          },
        })) as WhookOpenAPI;

        return {
          name: cleanedName,
          type: 'route',
          openAPI,
          definition:
            ROUTES_DEFINITIONS[cleanedName]?.module?.definition || config,
        };
      } else if (config.type === 'cron') {
        CRONS_DEFINITIONS =
          CRONS_DEFINITIONS ||
          (await $injector(['CRONS_DEFINITIONS'])).CRONS_DEFINITIONS;

        return {
          name: cleanedName,
          type: 'cron',
          definition:
            CRONS_DEFINITIONS[cleanedName]?.module?.definition || config,
        };
      } else if (config.type === 'consumer') {
        CONSUMERS_DEFINITIONS =
          CONSUMERS_DEFINITIONS ||
          (await $injector(['CONSUMERS_DEFINITIONS'])).CONSUMERS_DEFINITIONS;

        return {
          name: cleanedName,
          type: 'consumer',
          definition:
            CONSUMERS_DEFINITIONS[cleanedName]?.module?.definition || config,
        };
      }

      log('error', '💥 - AWS Lambda does not support this definition!');
      throw new YError('E_UNSUPPORTED_DEFINITION', serviceName, cleanedName);
    };
  })();

  log('debug', '🤖 - Initializing the AWS Lambdas `$autoload` build wrapper.');

  return async (serviceName) => {
    if (serviceName.startsWith('MAIN_API_')) {
      const definition = await getDefinition(serviceName);

      return constant(
        serviceName,
        definition.type === 'route' ? definition.openAPI : {},
      );
    }

    if (serviceName.startsWith('MAIN_DEFINITION_')) {
      const { definition } = await getDefinition(serviceName);

      return constant(serviceName, definition);
    }

    if (serviceName.startsWith('MAIN_WRAPPER_')) {
      const { type, definition } = await getDefinition(serviceName);
      let finalType: keyof typeof AWS_WRAPPERS = type;

      if (type === 'consumer') {
        finalType = definition.config?.options.wrapper || 'consumer';
      }

      return location(
        alsoInject(
          [
            `MAIN_DEFINITION>${serviceName.replace(
              'MAIN_WRAPPER_',
              'MAIN_DEFINITION_',
            )}`,
            ...(type === 'route'
              ? [
                  `MAIN_API>${serviceName.replace(
                    'MAIN_WRAPPER_',
                    'MAIN_API_',
                  )}`,
                ]
              : []),
          ],
          AWS_WRAPPERS[finalType].initializer as any,
        ) as any,
        `@whook/aws-lambda/dist/wrappers/${AWS_WRAPPERS[finalType].name}.js`,
      ) as any;
    }

    if (serviceName.startsWith('MAIN_HANDLER_')) {
      const { type, name, definition } = await getDefinition(serviceName);
      const targetHandler = definition.config?.targetHandler || name;

      return location(
        alsoInject(
          [
            `MAIN_WRAPPER>MAIN_WRAPPER_${serviceName.replace(
              'MAIN_HANDLER_',
              '',
            )}`,
            // TODO: Review it
            // Only inject wrappers for HTTP routes and
            // eventually inject other ones
            `?WRAPPERS>${type.toUpperCase()}S_WRAPPERS`,
            `BASE_HANDLER>${targetHandler}`,
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
