import {
  Knifecycle,
  wrapInitializer,
  constant,
  alsoInject,
  location,
  type Injector,
  type Autoloader,
  type Initializer,
  type Service,
  type ServiceInitializerWrapper,
  type ServiceInitializer,
} from 'knifecycle';
import { YError } from 'yerror';
import { initBuildAutoload } from '@whook/dev';
import {
  noop,
  initMainHandler,
  type WhookOpenAPI,
  type WhookDefinitions,
  type WhookCronDefinition,
  type WhookRouteDefinition,
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
      definition: WhookRouteDefinition & {
        type: 'route';
        url: `file:///${string}`;
      };
      openAPI: WhookOpenAPI;
    }
  | {
      definition: WhookCronDefinition & {
        type: 'cron';
        url: `file:///${string}`;
      };
    }
  | {
      definition: WhookConsumerDefinition & {
        type: 'consumer';
        url: `file:///${string}`;
      };
    }
  | {
      definition: WhookTransformerDefinition & {
        type: 'transformer';
        url: `file:///${string}`;
      };
    }
);

export interface WhookAWSLambdaAutoloadDependencies {
  $injector: Injector<Service>;
  $instance: Knifecycle;
  log?: LogService;
}

export const AWS_WRAPPERS = {
  route: {
    name: 'wrapRouteHandlerForAWSLambda',
    initializer: initWrapRouteHandlerForAWSLambda,
  },
  cron: {
    name: 'wrapCronHandlerForAWSLambda',
    initializer: initWrapCronHandlerForAWSLambda,
  },
  consumer: {
    name: 'wrapConsumerHandlerForAWSLambda',
    initializer: initWrapConsumerHandlerForAWSLambda,
  },
  log: {
    name: 'wrapLogSubscriberHandlerForAWSLambda',
    initializer: initWrapLogSubscriberHandlerForAWSLambda,
  },
  transformer: {
    name: 'wrapTransformerHandlerForAWSLambda',
    initializer: initWrapTransformerHandlerForAWSLambda,
  },
  kafka: {
    name: 'wrapKafkaConsumerHandlerForAWSLambda',
    initializer: initWrapKafkaConsumerHandlerForAWSLambda,
  },
  s3: {
    name: 'wrapS3HandlerForAWSLambda',
    initializer: initWrapS3HandlerForAWSLambda,
  },
};

const initializerWrapper: ServiceInitializerWrapper<
  Autoloader<Initializer<unknown, Service>>,
  WhookAWSLambdaAutoloadDependencies
> = async (
  { $injector, log = noop }: WhookAWSLambdaAutoloadDependencies,
  $autoload: Autoloader<Initializer<unknown, Service>>,
): Promise<Autoloader<Initializer<unknown, Service>>> => {
  let API: WhookOpenAPI;
  let DEFINITIONS: WhookDefinitions;
  const getDefinition = (() => {
    return async (serviceName: string): Promise<WhookAWSLambdaDefinition> => {
      const cleanedName = serviceName.split('_').pop() as string;

      API = API || (await $injector(['API'])).API;
      DEFINITIONS =
        DEFINITIONS || (await $injector(['DEFINITIONS'])).DEFINITIONS;

      const config = DEFINITIONS.configs[cleanedName as string];

      if (!config) {
        log('error', '💥 - Unable to find an AWS Lambda config!');
        throw new YError('E_OPERATION_NOT_FOUND', [serviceName, cleanedName]);
      }

      if (config.type === 'route') {
        const openAPI = await cleanupOpenAPI({
          ...API,
          paths: {
            [config.path]: {
              parameters: API?.paths?.[config.path]?.parameters || [],
              [config.method]: API.paths?.[config.path]?.[config.method],
            },
          },
        } as WhookOpenAPI);

        return {
          name: cleanedName,
          openAPI,
          definition: config,
        };
      } else if (config.type === 'cron') {
        return {
          name: cleanedName,
          definition: config,
        };
      } else if (config.type === 'consumer') {
        return {
          name: cleanedName,
          definition: config,
        };
      } else if (config.type === 'transformer') {
        return {
          name: cleanedName,
          definition: config,
        };
      }

      log('error', '💥 - AWS Lambda does not support this definition!');
      throw new YError('E_UNSUPPORTED_DEFINITION', [serviceName, cleanedName]);
    };
  })();

  log('debug', '🤖 - Initializing the AWS Lambdas `$autoload` build wrapper.');

  return async (serviceName) => {
    if (serviceName.startsWith('MAIN_API_')) {
      const definition = await getDefinition(serviceName);

      return constant(
        serviceName,
        'openAPI' in definition ? definition.openAPI : {},
      );
    }

    if (serviceName.startsWith('MAIN_WRAPPER_')) {
      const { definition } = await getDefinition(serviceName);
      let finalType: keyof typeof AWS_WRAPPERS = definition.type;

      if (definition.type === 'consumer') {
        finalType = definition.config?.options?.wrapper || 'consumer';
      }

      return location(
        alsoInject(
          [
            `MAIN_DEFINITION>${serviceName.replace(
              'MAIN_WRAPPER_',
              'MAIN_DEFINITION_',
            )}`,
            ...(definition.type === 'route'
              ? [
                  `MAIN_API>${serviceName.replace(
                    'MAIN_WRAPPER_',
                    'MAIN_API_',
                  )}`,
                ]
              : []),
          ],
          AWS_WRAPPERS[finalType].initializer as unknown as ServiceInitializer<
            Service,
            unknown
          >,
        ),
        `@whook/aws-lambda/dist/wrappers/${AWS_WRAPPERS[finalType].name}.js`,
      );
    }

    if (serviceName.startsWith('MAIN_HANDLER_')) {
      const { name, definition } = await getDefinition(serviceName);
      const targetHandler = definition.config?.targetHandler || name;

      return location(
        alsoInject(
          [
            `MAIN_DEFINITION>MAIN_DEFINITION_${serviceName.replace(
              'MAIN_HANDLER_',
              '',
            )}`,
            `MAIN_WRAPPER>MAIN_WRAPPER_${serviceName.replace(
              'MAIN_HANDLER_',
              '',
            )}`,
            `MAIN_WRAPPERS>${definition.type.toUpperCase()}S_WRAPPERS`,
            `?MAIN_WRAPPERS_ORDER>${definition.type.toUpperCase()}S_WRAPPERS_ORDER`,
            `BASE_HANDLER>${targetHandler}`,
          ],
          initMainHandler,
        ),
        '@whook/whook/dist/services/MAIN_HANDLER.js',
      );
    }

    return await $autoload(serviceName);
  };
};

/**
 * Wrap the _autoload service in order to build for AWS
 *  Lambda compatible code.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   $instance
 * A Knifecycle instance
 * @param  {Object}   $injector
 * The Knifecycle injector
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export default alsoInject(
  ['$instance', '$injector', '?log'],
  wrapInitializer(initializerWrapper, initBuildAutoload),
);
